import cv2
import numpy as np
from PIL import Image
import base64
import io
import os
from config import Config

class ImageProcessor:
    """Handles all image preprocessing for emotion detection"""
    
    def __init__(self):
        self.image_size = Config.IMAGE_SIZE
        self.grayscale = Config.GRAYSCALE
        
        # Load Haar Cascade for face detection
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
    def preprocess_for_model(self, image):
        """
        Preprocess image for model inference
        
        Args:
            image: numpy array (BGR or grayscale)
            
        Returns:
            Preprocessed image ready for model (shape: (1, height, width, 1))
        """
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
            
        # Resize to model input size
        resized = cv2.resize(gray, self.image_size)
        
        # Normalize pixel values to [0, 1]
        normalized = resized.astype('float32') / 255.0
        
        # Reshape for model: (1, height, width, 1)
        preprocessed = normalized.reshape(1, *self.image_size, 1)
        
        return preprocessed
    
    def detect_faces(self, image):
        """
        Detect faces in image using Haar Cascade
        
        Args:
            image: numpy array (BGR or grayscale)
            
        Returns:
            List of face regions [(x, y, w, h), ...]
        """
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
            
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        return faces
    
    def extract_face_region(self, image, face_coords):
        """
        Extract face region from image
        
        Args:
            image: numpy array
            face_coords: tuple (x, y, w, h)
            
        Returns:
            Face region as numpy array
        """
        x, y, w, h = face_coords
        face_region = image[y:y+h, x:x+w]
        return face_region
    
    def process_uploaded_file(self, file_path):
        """
        Process uploaded image file
        
        Args:
            file_path: Path to uploaded image file
            
        Returns:
            tuple: (preprocessed_face, original_image, face_coords) or (None, None, None) if no face
        """
        try:
            # Read image
            image = cv2.imread(file_path)
            
            if image is None:
                return None, None, None
            
            # Detect faces
            faces = self.detect_faces(image)
            
            if len(faces) == 0:
                return None, image, None
            
            # Get largest face (assuming it's the primary subject)
            largest_face = max(faces, key=lambda face: face[2] * face[3])
            
            # Extract face region
            face_region = self.extract_face_region(image, largest_face)
            
            # Preprocess for model
            preprocessed = self.preprocess_for_model(face_region)
            
            return preprocessed, image, largest_face
            
        except Exception as e:
            print(f"Error processing uploaded file: {str(e)}")
            return None, None, None
    
    def process_base64_frame(self, base64_string):
        """
        Process base64 encoded image (from webcam)
        
        Args:
            base64_string: Base64 encoded image string
            
        Returns:
            tuple: (preprocessed_face, original_frame, face_coords) or (None, None, None) if no face
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(base64_string)
            
            # Convert to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return None, None, None
            
            # Detect faces
            faces = self.detect_faces(image)
            
            if len(faces) == 0:
                return None, image, None
            
            # Get largest face
            largest_face = max(faces, key=lambda face: face[2] * face[3])
            
            # Extract face region
            face_region = self.extract_face_region(image, largest_face)
            
            # Preprocess for model
            preprocessed = self.preprocess_for_model(face_region)
            
            return preprocessed, image, largest_face
            
        except Exception as e:
            print(f"Error processing base64 frame: {str(e)}")
            return None, None, None
    
    def save_processed_image(self, image, output_path):
        """
        Save processed image to disk
        
        Args:
            image: numpy array
            output_path: Path to save image
        """
        try:
            cv2.imwrite(output_path, image)
            return True
        except Exception as e:
            print(f"Error saving image: {str(e)}")
            return False
    
    def draw_emotion_on_image(self, image, face_coords, emotion, confidence):
        """
        Draw emotion label and bounding box on image
        
        Args:
            image: numpy array
            face_coords: tuple (x, y, w, h)
            emotion: string
            confidence: float
            
        Returns:
            Image with annotations
        """
        x, y, w, h = face_coords
        
        # Create copy to avoid modifying original
        annotated = image.copy()
        
        # Draw rectangle around face
        cv2.rectangle(annotated, (x, y), (x+w, y+h), (0, 255, 0), 2)
        
        # Prepare text
        label = f"{emotion}: {confidence:.1%}"
        
        # Calculate text size and position
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.7
        thickness = 2
        (text_width, text_height), baseline = cv2.getTextSize(label, font, font_scale, thickness)
        
        # Draw background rectangle for text
        cv2.rectangle(
            annotated,
            (x, y - text_height - 10),
            (x + text_width, y),
            (0, 255, 0),
            -1
        )
        
        # Draw text
        cv2.putText(
            annotated,
            label,
            (x, y - 5),
            font,
            font_scale,
            (0, 0, 0),
            thickness
        )
        
        return annotated
    
    def validate_file_extension(self, filename):
        """
        Check if file has allowed extension
        
        Args:
            filename: Name of file to check
            
        Returns:
            Boolean indicating if extension is allowed
        """
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    
    def process_profile_picture(self, file_path, output_path):
        """
        Process and resize profile picture
        
        Args:
            file_path: Path to uploaded profile picture
            output_path: Path to save processed picture
            
        Returns:
            Boolean indicating success
        """
        try:
            # Open image with PIL
            img = Image.open(file_path)
            
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to 300x300 (profile picture size)
            img = img.resize((300, 300), Image.Resampling.LANCZOS)
            
            # Save
            img.save(output_path, 'JPEG', quality=90)
            
            return True
            
        except Exception as e:
            print(f"Error processing profile picture: {str(e)}")
            return False