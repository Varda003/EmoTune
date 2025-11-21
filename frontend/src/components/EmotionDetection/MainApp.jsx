import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { emotionAPI, musicAPI, getUser, logout } from '../../services/api';
import WebcamCapture from './WebcamCapture';
import { moodTracker } from '../../utils/moodTracker';
import { motion } from "framer-motion";



const MainApp = () => {
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user] = useState(getUser());
  const [recommendationHistory, setRecommendationHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [language, setLanguage] = useState('english');
  const [error, setError] = useState('');
  const [loadingMusic, setLoadingMusic] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [likedSongs, setLikedSongs] = useState({});
  const [currentBatch, setCurrentBatch] = useState(0); // 0 = first 8, 1 = next 4, 2 = last 4

  const emotions = [
    { name: 'happy', emoji: '😊', label: 'Happy' },
    { name: 'sad', emoji: '😢', label: 'Sad' },
    { name: 'angry', emoji: '😠', label: 'Angry' },
    { name: 'neutral', emoji: '😐', label: 'Neutral' },
    { name: 'surprise', emoji: '😲', label: 'Surprise' },
    { name: 'fear', emoji: '😰', label: 'Fear' },
    { name: 'disgust', emoji: '🤢', label: 'Disgust' }
  ];

  const emotionEmojis = {
    happy: '😊', sad: '😢', angry: '😠', neutral: '😐',
    surprised: '😲', fear: '😰', disgust: '🤢'
  };

  const emotionQuotes = {
  happy: "Happiness is contagious spread it everywhere you go!",
  sad: "Even the darkest night will end and the sun will rise.",
  angry: "Anger doesn’t solve anything, but calm thinking does.",
  neutral: "Every moment is a fresh beginning stay balanced.",
  surprise: "Life is full of surprises embrace them with a smile!",
  fear: "Courage is not the absence of fear, but acting in spite of it.",
  disgust: "Let go of what you dislike, and focus on what brings peace."
};


  useEffect(() => {
    const handleProfileImageUpdate = () => {
      setProfileImage(localStorage.getItem('profileImage'));
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);

    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleDetectEmotion = async () => {
  if (!selectedImage) {
    setError('Please select an image first');
    return;
  }

  setDetecting(true);
  setError('');

  try {
    const response = await emotionAPI.detectFromUpload(selectedImage);

    if (response.success) {
      const emotion = {
        emotion: response.emotion,
        confidence: response.confidence,
        emoji: response.emoji || emotionEmojis[response.emotion.toLowerCase()]
      };
      setDetectedEmotion(emotion);
      setSelectedMood(response.emotion.toLowerCase());
      
      // ✅ TRACK THE DETECTED MOOD
      moodTracker.saveMood(response.emotion.toLowerCase());
      
      fetchMusicRecommendations(response.emotion.toLowerCase());
    } else {
      setError(response.message || 'Failed to detect emotion');
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to detect emotion. Please try again.');
  } finally {
    setDetecting(false);
  }
};

  

  // Update fetchMusicRecommendations to show first 8 songs
const fetchMusicRecommendations = async (emotion, lang = language) => {
  setLoadingMusic(true);
  setCurrentBatch(0);
  try {
    const response = await musicAPI.getRecommendations(emotion.toLowerCase(), lang, 8);
    
    if (response.success && response.tracks) {
      setRecommendations(response.tracks);
    } else {
      const allSongs = getDummyRecommendations(emotion, lang); // lang use karo
      setRecommendations(allSongs.slice(0, 8));
    }
  } catch (err) {
    console.error('Music API error:', err);
    const allSongs = getDummyRecommendations(emotion, lang); // lang use karo
    setRecommendations(allSongs.slice(0, 8));
  } finally {
    setLoadingMusic(false);
  }
};
  const handleDirectMoodSelection = (emotionName) => {
  setSelectedMood(emotionName);
  const emotion = emotions.find(e => e.name === emotionName);
  setDetectedEmotion({
    emotion: emotion.label,
    confidence: 1.0,
    emoji: emotion.emoji
  });
  
  // Track the mood
  moodTracker.saveMood(emotionName);
  
  fetchMusicRecommendations(emotionName);
};

  const getDummyRecommendations = (emotion, lang = 'english') => {
  const dummyData = {
    happy: {
      english: [
      { id: '0RiRZpuVRbi7oqRdSMwhQY' },
      { id: '1xznGGDReH1oQq0xzbwXa3' },
      { id: '7BqHUALzNBTanL6OvsqmC1' },
      { id: '45Egmo7icyopuzJN0oMEdk' },
      { id: '5oID3Qj3tTCZEH9eo0snxm' },
      { id: '3PfIrDoz19wz7qK7tYeu62' },
      { id: '7qiZfU4dY1lWllzX7mPBI3'},
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '2FubKMjTFEGN09nknQUbC8' },
      { id: '5fr7VBuNTiXAq4rH1e3v3q' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    punjabi: [
      { id: '2mwBSO58y92EYmEFpDfmS7' },
      { id: '3Oe3VdPn6rAueriQvFhCBA' },
      { id: '1zqANJCtkCOzGR7beikLd6' },
      { id: '3F0I9AkbRwz12yz7Hxn0bF' },
      { id: '7q7eYVerltlW2sYBuga6Mj' },
      { id: '39ujbBjTwwqUFySaCYDMMT'  },
      { id: '1iZLpuGMr4tn1F5bZu32Kb' },
      { id: '6mdLX10dvBb7rGYbMXpKzz' },
      // Next 4 songs (refresh 1)
      { id: '3f8t2LZGYtdNQh8SNEiZcG' },
      { id: '4t77OsiudWy4timV32lPa2' },
      { id: '1QZRCi2Z1DQQaR6bGAzhtN' },
      { id: '4cQxBfdD5nNJaLcPIY3EcK' },
      // Next 4 songs (refresh 2)
      { id: '2Wu9PNpLUCBl3W1GaPqkhl' },
      { id: '32LKwbmh6yVsWoRRF8DIvf' },
      { id: '72vuBPMhwFNlSYpTSf6fVD' },
      { id: '1tEto4JrqNmBZFH5uAiYqb' }
    ],
    hindi: [
      { id: '6k3XXCE1ZzwevQlxf8dNaw' },
      { id: '65dt1vedDHPOCCPS3mVhtN' },
      { id: '0qPoQiQIhgyMaP7X78hxri' },
      { id: '7xxxQG1BupSnOBo4qId9kl' },
      { id: '0eLtIxPRNJfsmehITZ1qaJ' },
      { id: '5PUXKVVVQ74C3gl5vKy9Li' },
      { id: '3x822BpQYSFMIB7P3uiJN0'  },
      { id: '7eQl3Yqv35ioqUfveKHitE' },
      // Next 4 songs (refresh 1)
      { id: '18YHbIhrleUkKKj2DvEp79' },
      { id: '2tjWCe2W7sgvS3C8NHcdtI' },
      { id: '3jyqXdAjwqO3gFtjnYrbq9' },
      { id: '0gPgdRfB4jdGrlyXS0Vx78' },
      // Next 4 songs (refresh 2)
      { id: '0GQngE2rOYvlKwEQjTAsP8' },
      { id: '1gwO79MdYdumgIjxq8eCxB' },
      { id: '0EH7sgeiFqDa3eS7ieW2zs' },
      { id: '2YNgcIiD73XsXFNM3UuxlM' }
],
      french: [
      { id: '0RE4crnT3jRms1xxVlEZx2' },
      { id: '1Bhm5HNO1cq8olDbBmokyL' },
      { id: '6zvHwijlnwqjS6d46yAffi' },
      { id: '65uoaqX5qcjXZRheAj1qQT' },
      { id: '4lsOsGMzO1yCjGVucoWOZ1' },
      { id: '18ZX6YaDSOopXPRvfIh8DM' },
      { id: '4VWbPQUPvLes814r6T11Jz'  },
      { id: '1zyUz3eZ3sytdaR9lfW17q' },
      // Next 4 songs (refresh 1)
      { id: '6nGeLlakfzlBcFdZXteDq7' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '6JFw2mbcNfoFXnrk6AxGK6' },
      { id: '7arCRGABaKdEFvGa3gCM9d' },
      // Next 4 songs (refresh 2)
      { id: '7sKDftgGirHWTVFMtJoDoh' },
      { id: '1MqzIgGsHP4cNjPboevsfq' },
      { id: '1R1deVa4LzVxzgFIpvS2O3' },
      { id: '5cAzaNbU7AEgfsJgL9sbtX' }
],
      spanish: [
      { id: '2AY1UAimvTqjJC8vDJsOyy' },
      { id: '4w8niZpiMy6qz1mntFA5uM' },
      { id: '4ipnJyDU3Lq15qBAYNqlqK' },
      { id: '6habFhsOp2NvshLv26DqMb' },
      { id: '6Za3190Sbw39BBC77WSS1C' },
      { id: '2ijef6ni2amuunRoKTlgww' },
      { id: '4QtiVmuA88tPQiCOHZuQ5b'  },
      { id: '48fKgzfvTU4U7eyRtIYaHP' },
      // Next 4 songs (refresh 1)
      { id: '5w9c2J52mkdntKOmRLeM2m' },
      { id: '63aj87TQG6F3RVO5nbG2VQ' },
      { id: '079Ey5uxL04AKPQgVQwx5h' },
      { id: '6IPNp9PfaEqrzotY47TIWy' },
      // Next 4 songs (refresh 2)
      { id: '6DRGwsUFQrNerxRexK7KMB' },
      { id: '5YoITs1m0q8UOQ4AW7N5ga' },
      { id: '5bKDKo9lhFvTQR517vQuSH' },
      { id: '0gxbA4bZN8KyNHsCUfNvyr' }
    ],
      korean: [
      { id: '02sy7FAs8dkDNYsHp4Ul3f' },
      { id: '5H1sKFMzDeMtXwND3V6hRY' },
      { id: '3XYRV7ZSHqIRDG87DKTtry' },
      { id: '3zhbXKFjUDw40pTYyCgt1Y' },
      { id: '6u0pZe0Uv7GBR0iKptfWRf' },
      { id: '6qAzAmPBUpGrk7XADZHR5k' },
      { id: '3ejAkJLWQSEJDqDXxK3efB'  },
      { id: '1R0hxCA5R7z5TiaXBZR7Mf' },
      // Next 4 songs (refresh 1)
      { id: '1t2qYCAjUAoGfeFeoBlK51' },
      { id: '5mpWGq83n0sIgGRopGk5QZ' },
      { id: '5KfbFCacFuNJGdK2zvovcF' },
      { id: '0dnkOK5hGUCmIJ7FDF0yHz' },
      // Next 4 songs (refresh 2)
      { id: '2zrhoHlFKxFTRF5aMyxMoQ' },
      { id: '0jFHMDRXxKaREor3hBEEST' },
      { id: '69BIczdH6QMnFx7dsSssN8' },
      { id: '2gYj9lubBorOPIVWsTXugG' }
    ],

      japanese: [
      { id: '2BHj31ufdEqVK5CkYDp9mA' },
      { id: '49h5Aav6yn1o1ACGyovDdZ' },
      { id: '348NF6vX0Yh22xvH0EZEro' },
      { id: '2BBIUV8wIBbqc7HXObzdgH' },
      { id: '3CeUMk1K4RPOpyzxn7JKZV' },
      { id: '3zeV6b2FMFsLHopzHHnS6J'  },
      { id: '7GxUPZNxNPvDToM4FkXE6G' },
      { id: '172zA5Yn0YzayQWvEJuGAm' },
      // Next 4 songs (refresh 1)
      { id: '7rU6Iebxzlvqy5t857bKFq' },
      { id: '4HYDnQZcpfpsttuoaY9gsp' },
      { id: '4FlDhqXIaF6wiT7ssRTACB' },
      { id: '0zoGVO4bQXG8U6ChKwNgeg' },
      // Next 4 songs (refresh 2)
      { id: '5WTCHYg9G27e9e5HFKGdd1' },
      { id: '4rvtqOGyTPZJwWtVTNdZbu' },
      { id: '5RbMlPFL4gVyEHW2lEOuzG' },
      { id: '3OdkC5pG8vc26S26qHyBo8' }
    ]
      
  },
    sad: {
      english: [
      { id: '4kflIGfjdZJW4ot2ioixTB' },
      { id: '7LVHVU3tWfcxj5aiPFEW4Q' },
      { id: '0IF0HlkwzIpvSCI6XCw3RM' },
      { id: '21FX3Jb9azH08Nz0GKRQ3c' },
      { id: '2qxmye6gAegTMjLKEBoR3d' },
      { id: '6FZDfxM3a3UCqtzo5pxSLZ' },
      { id: '1v1oIWf2Xgh54kIWuKsDf6' },
      { id: '1J14CdDAvBTE1AJYUOwl6C' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }    
    ],
    hindi: [
    { id: '4kflIGfjdZJW4ot2ioixTB' },
      { id: '7LVHVU3tWfcxj5aiPFEW4Q' },
      { id: '0IF0HlkwzIpvSCI6XCw3RM' },
      { id: '21FX3Jb9azH08Nz0GKRQ3c' },
      { id: '2qxmye6gAegTMjLKEBoR3d' },
      { id: '6FZDfxM3a3UCqtzo5pxSLZ' },
      { id: '1v1oIWf2Xgh54kIWuKsDf6' },
      { id: '1J14CdDAvBTE1AJYUOwl6C' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    punjabi: [
    { id: '4kflIGfjdZJW4ot2ioixTB' },
      { id: '7LVHVU3tWfcxj5aiPFEW4Q' },
      { id: '0IF0HlkwzIpvSCI6XCw3RM' },
      { id: '21FX3Jb9azH08Nz0GKRQ3c' },
      { id: '2qxmye6gAegTMjLKEBoR3d' },
      { id: '6FZDfxM3a3UCqtzo5pxSLZ' },
      { id: '1v1oIWf2Xgh54kIWuKsDf6' },
      { id: '1J14CdDAvBTE1AJYUOwl6C' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    french: [
      { id: '4kflIGfjdZJW4ot2ioixTB' },
      { id: '7LVHVU3tWfcxj5aiPFEW4Q' },
      { id: '0IF0HlkwzIpvSCI6XCw3RM' },
      { id: '21FX3Jb9azH08Nz0GKRQ3c' },
      { id: '2qxmye6gAegTMjLKEBoR3d' },
      { id: '6FZDfxM3a3UCqtzo5pxSLZ' },
      { id: '1v1oIWf2Xgh54kIWuKsDf6' },
      { id: '1J14CdDAvBTE1AJYUOwl6C' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    spanish: [
      { id: '4kflIGfjdZJW4ot2ioixTB' },
      { id: '7LVHVU3tWfcxj5aiPFEW4Q' },
      { id: '0IF0HlkwzIpvSCI6XCw3RM' },
      { id: '21FX3Jb9azH08Nz0GKRQ3c' },
      { id: '2qxmye6gAegTMjLKEBoR3d' },
      { id: '6FZDfxM3a3UCqtzo5pxSLZ' },
      { id: '1v1oIWf2Xgh54kIWuKsDf6' },
      { id: '1J14CdDAvBTE1AJYUOwl6C' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    korean: [
      { id: '4kflIGfjdZJW4ot2ioixTB' },
      { id: '7LVHVU3tWfcxj5aiPFEW4Q' },
      { id: '0IF0HlkwzIpvSCI6XCw3RM' },
      { id: '21FX3Jb9azH08Nz0GKRQ3c' },
      { id: '2qxmye6gAegTMjLKEBoR3d' },
      { id: '6FZDfxM3a3UCqtzo5pxSLZ' },
      { id: '1v1oIWf2Xgh54kIWuKsDf6' },
      { id: '1J14CdDAvBTE1AJYUOwl6C' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    japanese: [
      { id: '4kflIGfjdZJW4ot2ioixTB' },
      { id: '7LVHVU3tWfcxj5aiPFEW4Q' },
      { id: '0IF0HlkwzIpvSCI6XCw3RM' },
      { id: '21FX3Jb9azH08Nz0GKRQ3c' },
      { id: '2qxmye6gAegTMjLKEBoR3d' },
      { id: '6FZDfxM3a3UCqtzo5pxSLZ' },
      { id: '1v1oIWf2Xgh54kIWuKsDf6' },
      { id: '1J14CdDAvBTE1AJYUOwl6C' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ]
  },
    angry: {
      english: [
      { id: '60a0Rd6pjrkxjPbaKzXjfq'},
      { id: '2bL2gyO6kBdLkNSkxXNh6x'},
      { id: '5ghIJDpPoe3CfHMGu71E6T'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      { id: '2uqxsofWmgRT0ekghgy3ln'},
      { id: '4De0GQSQv4Hqnmd4fdMyAY'},
      { id: '1pfvzAelLOdPS0CAULo77c'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
      hindi: [
      { id: '60a0Rd6pjrkxjPbaKzXjfq'},
      { id: '2bL2gyO6kBdLkNSkxXNh6x'},
      { id: '5ghIJDpPoe3CfHMGu71E6T'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      { id: '2uqxsofWmgRT0ekghgy3ln'},
      { id: '4De0GQSQv4Hqnmd4fdMyAY'},
      { id: '1pfvzAelLOdPS0CAULo77c'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
 ],
      punjabi: [
      { id: '60a0Rd6pjrkxjPbaKzXjfq'},
      { id: '2bL2gyO6kBdLkNSkxXNh6x'},
      { id: '5ghIJDpPoe3CfHMGu71E6T'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      { id: '2uqxsofWmgRT0ekghgy3ln'},
      { id: '4De0GQSQv4Hqnmd4fdMyAY'},
      { id: '1pfvzAelLOdPS0CAULo77c'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
   ],
      french: [
      { id: '60a0Rd6pjrkxjPbaKzXjfq'},
      { id: '2bL2gyO6kBdLkNSkxXNh6x'},
      { id: '5ghIJDpPoe3CfHMGu71E6T'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      { id: '2uqxsofWmgRT0ekghgy3ln'},
      { id: '4De0GQSQv4Hqnmd4fdMyAY'},
      { id: '1pfvzAelLOdPS0CAULo77c'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
      spanish: [
      { id: '60a0Rd6pjrkxjPbaKzXjfq'},
      { id: '2bL2gyO6kBdLkNSkxXNh6x'},
      { id: '5ghIJDpPoe3CfHMGu71E6T'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      { id: '2uqxsofWmgRT0ekghgy3ln'},
      { id: '4De0GQSQv4Hqnmd4fdMyAY'},
      { id: '1pfvzAelLOdPS0CAULo77c'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
      korean: [
      { id: '60a0Rd6pjrkxjPbaKzXjfq'},
      { id: '2bL2gyO6kBdLkNSkxXNh6x'},
      { id: '5ghIJDpPoe3CfHMGu71E6T'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      { id: '2uqxsofWmgRT0ekghgy3ln'},
      { id: '4De0GQSQv4Hqnmd4fdMyAY'},
      { id: '1pfvzAelLOdPS0CAULo77c'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
      japanese: [
      { id: '60a0Rd6pjrkxjPbaKzXjfq'},
      { id: '2bL2gyO6kBdLkNSkxXNh6x'},
      { id: '5ghIJDpPoe3CfHMGu71E6T'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      { id: '2uqxsofWmgRT0ekghgy3ln'},
      { id: '4De0GQSQv4Hqnmd4fdMyAY'},
      { id: '1pfvzAelLOdPS0CAULo77c'},
      { id: '4fouWK6XVHhzl78KzQ1UjL'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
]
  },
    neutral: {
      english: [
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
      hindi: [
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
      punjabi:[
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
      french: [
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
      spanish: [
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
   ],
      korean: [
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
   ],
   japanese: [
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      { id: '6AI3ezQ4o3HUoP6Dhudph3'},
      { id: '53CJANUxooaqGOtdsBTh7O'},
      { id: '02MWAaffLxlfxAUY7c5dvx'},
      { id: '5vNRhkKd0yEAg8suGBpjeY'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
   ]      
  },
    surprise: {
      english: [
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    hindi: [
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    punjabi: [
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    french: [
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    spanish: [
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    korean: [
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    japanese: [
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      { id: '3e9HZxeyfWwjeyPAMmWSSQ'},
      { id: '6964mJTlD7fnWYdxuDJwyO'},
      { id: '04c0sgiXUEBi0EtCFHZgof'},
      { id: '1kUyOJb3fzUo8r0OCz5SQ' },
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ]
  },
    fear: {
      english: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    hindi: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    punjabi: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    french: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    spanish: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    korean: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    japanese:[
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ]
  },
    disgust: {
      english: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    hindi: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    punjabi: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    french: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    spanish: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    korean: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ],
    japanese: [
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      { id: '4SSnFejRGlZikf02HLewEF'},
      { id: '1882UlTYVk8VOFzM6eANoo'},
      { id: '5ZLUm9eab8y3tqQ1OhQSHI'},
      { id: '1zB4vmk8tFRmM9UULNzbLB'},
      // Next 4 songs (refresh 1)
      { id: '60nZcImufyMA1MKQY3dcCH' },
      { id: '0pqnGHJpmpxLKifKRmU6WP' },
      { id: '5hslUAKq9I9CG2bAulFkHN' },
      { id: '32OlwWuMpZ6b0aN2RZOeMS' },
      // Next 4 songs (refresh 2)
      { id: '3AJwUDP919kvQ9QcozQPxg' },
      { id: '5ygDXis42ncn6kYG14lEVG' },
      { id: '6dBUzqjtbnIa1TwYbyw5CM' },
      { id: '2Foc5Q5nqNiosCNqttzHof' }
    ]
  }
  };
  const emotionData = dummyData[emotion.toLowerCase()] || dummyData.neutral;
  return emotionData[lang] || emotionData.english;
};




  // Updated handleRefresh with batching logic
const handleRefresh = () => {
  if (selectedMood) {
    const allSongs = getDummyRecommendations(selectedMood, language);
    let newRecs;
    let nextBatch;

    if (currentBatch === 0) {
      // Currently showing first 8, next show songs 8-11
      newRecs = allSongs.slice(8, 12);
      nextBatch = 1;
    } else if (currentBatch === 1) {
      // Currently showing 8-11, next show songs 12-15
      newRecs = allSongs.slice(12, 16);
      nextBatch = 2;
    } else {
      // Currently showing 12-15, loop back to first 8
      newRecs = allSongs.slice(0, 8);
      nextBatch = 0;
    }

    setCurrentBatch(nextBatch);
    setRecommendations(newRecs);
    
    // Update history for prev/next arrows
    const newHistory = [...recommendationHistory.slice(0, currentHistoryIndex + 1), newRecs];
    setRecommendationHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
  }
};

  const handlePrevious = () => {
  if (currentHistoryIndex > 0) {
    setCurrentHistoryIndex(currentHistoryIndex - 1);
    setRecommendations(recommendationHistory[currentHistoryIndex - 1]);
  }
};

const handleNext = () => {
  if (currentHistoryIndex < recommendationHistory.length - 1) {
    setCurrentHistoryIndex(currentHistoryIndex + 1);
    setRecommendations(recommendationHistory[currentHistoryIndex + 1]);
  }
};

  // handleLanguageChange - reset to first batch
const handleLanguageChange = (e) => {
  const newLang = e.target.value;
  setLanguage(newLang);
  setCurrentBatch(0);
  
  if (selectedMood) {
    // Direct newLang use karo, state wait mat karo!
    const allSongs = getDummyRecommendations(selectedMood, newLang);
    const newRecs = allSongs.slice(0, 8);
    setRecommendations(newRecs);
    
    // History reset
    setRecommendationHistory([newRecs]);
    setCurrentHistoryIndex(0);
  }
};

  const handleLikeSong = async (track) => {
    try {
      if (likedSongs[track.id]) {
        // Unlike
        setLikedSongs(prev => ({ ...prev, [track.id]: false }));
        alert(`💔 Removed "${track.title}" from liked songs`);
      } else {
        // Like
        await musicAPI.likeSong({
          song_title: track.title,
          artist: track.artist,
          album_art_url: null,
          spotify_track_id: track.id,
          spotify_preview_url: track.preview_url,
          genre: track.album,
          emotion_detected: selectedMood
        });

            // ✅ TRACK THE LIKED SONG
      moodTracker.saveLikedSong(track, selectedMood);
      
        setLikedSongs(prev => ({ ...prev, [track.id]: true }));
        alert(`"❤️ Added to your liked songs!`);
      }
    } catch (err) {
      console.error('Error liking song:', err);
    }
  };

  return (
    <div className="app-container">
      
      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
      </div>

      {/* Header */}
      <div className="header">
        <div className="header-logo"
        onClick={() => navigate('/')} 
        style={{ cursor: 'pointer' }}
    >
      🎵 EmoTune</div>
        <div className="header-nav">
  <span style={{ opacity: 1, fontSize: '1.3rem', marginRight: '15px' }}>
    Welcome, {user?.name || 'User'}
  </span>
  <div 
    className="profile-icon"
    onClick={() => navigate('/profile')}
    title="View Profile"
    style={{
      width: '55px',
      height: '55px',
      borderRadius: '50%',
      background: profileImage ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '1.5rem',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.1)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }}
  >
    {profileImage ? (
      <img 
        src={profileImage} 
        alt="Profile" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover' 
        }} 
      />
    ) : (
      '👤'
    )}
  </div>
  <button
    onClick={logout}
    style={{
    padding: '10px 20px',
    background: 'var(--warning-gradient)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '1.2rem',
    cursor: 'pointer',
    fontWeight: '550',
    transition: 'all 0.3s ease'
  }}
  >
    Logout
  </button>
</div>
</div>

      <div className="container">
        {error && <div className="error-message">{error}</div>}

        {/* Main Content - Changes based on detection state */}
        {!detectedEmotion ? (
          /* Before Detection - Center Layout */
          <div className="glass-card" style={{ textAlign: 'center', marginTop: '50px',padding: '60px 30px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '40px'
            }}>
              Emotion Detection Studio
            </h2>

            <div className="upload-section" style={{ maxWidth: '500px', margin: '0 auto 50px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div className="upload-buttons" style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '30px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={handleUploadClick}
                  style={{ width: 'auto', padding: '15px 30px' }}
                >
                  📁 Upload Image
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowWebcam(true)}
                  style={{ width: 'auto', padding: '15px 30px' }}
                >
                  📷 Capture from Camera
                </button>
              </div>

              {imagePreview && (
                <div style={{ marginBottom: '20px' }}>
                  <img 
                    src={imagePreview} 
                    alt="Selected" 
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '15px', border: '2px solid var(--glass-border)' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleDetectEmotion}
                    disabled={detecting}
                    style={{ marginTop: '20px' }}
                  >
                    {detecting ? (
                      <>
                        <span className="loading-spinner"></span> Detecting...
                      </>
                    ) : (
                      '🧠 Detect Emotion'
                    )}
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '25px', opacity: 0.9 }}>
                Or select your mood directly
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '15px',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                {emotions.map((emotion) => (
                  <div
                    key={emotion.name}
                    onClick={() => handleDirectMoodSelection(emotion.name)}
                    style={{
                      padding: '20px',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.background = 'var(--primary-gradient)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = 'var(--glass-bg)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{emotion.emoji}</div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{emotion.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* After Detection - Split Layout */
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '50px' }}>
              {/* Left: Upload Section */}
              <div className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>📸 Detection Options</h3>
                <div className="upload-section">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginBottom: '20px' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={handleUploadClick}
                    >
                      📁 Upload New Image
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setShowWebcam(true)}
                    >
                      📷 Capture from Camera
                    </button>
                  </div>

                  {imagePreview && (
                    <div>
                      <img 
                        src={imagePreview} 
                        alt="Selected" 
                        style={{ width: '100%', borderRadius: '15px', marginBottom: '15px' }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleDetectEmotion}
                        disabled={detecting}
                      >
                        {detecting ? 'Detecting...' : '🔄 Re-detect'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Detected Emotion */}
              <div className="glass-card dominant-emotion" style={{ textAlign: 'center' }}>
  <div className="emotion-icon-large">{detectedEmotion.emoji}</div>
  <div className="emotion-name-large">{detectedEmotion.emotion}</div>
  <div className="confidence-badge">
    {(detectedEmotion.confidence * 100).toFixed(1)}% Confident
  </div>

  {/* ✅ Motivational Quote with Fade-Up Animation */}
<motion.p
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  style={{
    marginTop: '15px',
    fontStyle: 'italic',
    fontSize: '1.3rem',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: '1.4'
  }}
>
  “{emotionQuotes[detectedEmotion.emotion.toLowerCase()] || 'Feel your emotion and let it guide you.'}”
</motion.p>


  {/* ✅ Clear Detection Button */}
  <motion.button
  key={`${detectedEmotion.emotion}-button`}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
  onClick={() => {
    setDetectedEmotion(null);
    setSelectedMood(null);
    setImagePreview(null);
    setSelectedImage(null);
    setRecommendations([]);
  }}
  style={{
    marginTop: "30px",
    padding: "10px 90px", // reduced size
    background: "linear-gradient(135deg, #00C853, #B2FF59)",
    border: "none",
    borderRadius: "25px",
    color: "white",
    fontWeight: "530",
    fontSize: "1.4rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginInline: "auto",
    boxShadow: "0 0 10px rgba(76, 175, 80, 0.4)",
    transition: "all 0.3s ease",
  }}
  whileHover={{ scale: 1.2}}
  whileTap={{ scale: 0.6 }}
>
  🧘 Clear Mood
</motion.button>

</div>
</div>

            {/* Music Recommendations */}
            <div className="glass-card">
              <div style={{ marginBottom: '30px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '15px'
                }}>
                  <h3 style={{ fontSize: '2rem', margin: 0 }}>
                    🎵 Recommended Music
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <select
                      value={language}
                      onChange={handleLanguageChange}
                      className="form-select"
                      style={{ 
                        width: 'auto', 
                        padding: '8px 10px',
                        background: 'rgba(13, 39, 144, 0.49)',
                        color: 'white',
                        border: '1px solid var(--glass-border)'
                      }}
                    >
                      <option value="english">🇺🇸 English</option>
                      <option value="punjabi">🇵🇦 Punjabi</option>
                      <option value="hindi">🇮🇳 Hindi</option>
                      <option value="french">🇫🇷 French</option>
                      <option value="spanish">🇪🇸 Spanish</option>
                      <option value="korean">🇰🇷 Korean</option>
                      <option value="japanese">🇯🇵 Japanese</option>
                    </select>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
  <button
    onClick={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const buttonWidth = rect.width;
      
      // Left third - Previous
      if (clickX < buttonWidth / 3 && currentHistoryIndex > 0) {
        handlePrevious();
      }
      // Right third - Next
      else if (clickX > (buttonWidth * 2) / 3 && currentHistoryIndex < recommendationHistory.length - 1) {
        handleNext();
      }
      // Middle - Refresh
      else {
        handleRefresh();
      }
    }}
    className="btn"
    style={{
      width: 'auto',
      padding: '6px 15px',
      background: 'var(--accent-gradient)',
      color: 'white',
      border: '1px solid var(--glass-border)',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer'
    }}
  >
    <span style={{ 
      fontSize: '1.2rem', 
      fontWeight: 'bolder',
      opacity: currentHistoryIndex <= 0 ? 0.4 : 1,
      transition: 'opacity 0.2s'
    }}>←</span>
    <span>REFRESH</span>
    <span style={{ 
      fontSize: '1.2rem', 
      fontWeight: 'bolder',
      opacity: currentHistoryIndex >= recommendationHistory.length - 1 ? 0.4 : 1,
      transition: 'opacity 0.2s'
    }}>→</span>
  </button>
</div>
                  </div>
                </div>

                {/* Mood Selector */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginBottom: '45px',
                  justifyContent: 'center'
                }}>
                  {emotions.map((emotion) => (
                    <button
                      key={emotion.name}
                      onClick={() => {
  setSelectedMood(emotion.name);
  setDetectedEmotion({
    emotion: emotion.name,
    emoji: emotionEmojis[emotion.name],
    confidence: 1.0,
  });
  fetchMusicRecommendations(emotion.name);
}}

                      style={{
                        padding: '10px 30px',
                        background: selectedMood === emotion.name ? 'var(--secondary-gradient)' : 'var(--glass-bg)',
                        border: `2px solid ${selectedMood === emotion.name ? 'var(--glass-border)' : 'transparent'}`,
                        borderRadius: '25px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: selectedMood === emotion.name ? '700' : '500',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        boxShadow: selectedMood === emotion.name ? '0 5px 20px rgba(240, 147, 251, 0.4)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedMood !== emotion.name) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedMood !== emotion.name) {
                          e.currentTarget.style.background = 'var(--glass-bg)';
                        }
                      }}
                    >
                      <span style={{ fontSize: '1.8rem' }}>{emotion.emoji}</span>
                      {emotion.label}
                    </button>
                  ))}
                </div>
              </div>

                     {loadingMusic ? (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <span
      className="loading-spinner"
      style={{ width: '40px', height: '40px' }}
    ></span>
    <p style={{ marginTop: '20px' }}>Loading recommendations...</p>
  </div>
) : (
  <>
    <style>
      {`
        .music-card iframe {
          overflow: hidden !important;
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        .music-card iframe::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}
    </style>

    <div className="music-grid">
      {recommendations.map((track, index) => (
        <div key={index} className="music-card">
          {/* Spotify Link Icon (top right corner) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '5px',
            }}
          >
            <a
              href={`https://open.spotify.com/track/${track.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(29, 185, 84, 0.15)',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(29, 185, 84, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(29, 185, 84, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(29, 185, 84, 0.15)';
              }}
              title="Open in Spotify"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14"
                  stroke="#1DB954"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          {/* Spotify Player Embed */}
          <div
            style={{
              marginBottom: '15px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: 'none',
              position: 'relative',
            }}
          >
            <iframe
              src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator`}
              width="100%"
              height="352"
              frameBorder="0"
              scrolling="no"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={`track-${track.id}`}
              style={{
                borderRadius: '12px',
                border: 'none',
                display: 'block',
                overflow: 'hidden',
              }}
            ></iframe>
          </div>

          {/* ❤️ Like Button */}
          <div
            className="music-actions"
            style={{ marginTop: '15px' }}
          >
            <button
              className={`action-btn like-btn ${likedSongs[track.id] ? 'liked' : ''}`}
              onClick={() => handleLikeSong(track)}
              style={{
                width: '100%',
                padding: '10px',
                background: likedSongs[track.id]
                  ? 'var(--secondary-gradient)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: likedSongs[track.id]
                  ? 'none'
                  : '2px solid var(--glass-border)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease',
              }}
            >
              {likedSongs[track.id] ? '❤️ Liked' : '🤍 Like'}
            </button>
          </div>
        </div>
      ))}
    </div>
  </>
)}

</div> {/* closes glass-card */}
</>
)}
</div> {/* closes main container */}

{/* ✅ Webcam Overlay */}
{showWebcam && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <WebcamCapture
      onCapture={(file, preview) => {
        setSelectedImage(file);
        setImagePreview(preview);
        setShowWebcam(false);
      }}
      onClose={() => setShowWebcam(false)}
    />
  </div>
)}

</div>
);
};

export default MainApp;
