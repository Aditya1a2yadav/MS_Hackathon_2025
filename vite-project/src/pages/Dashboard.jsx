import React, { useState } from 'react';
import axios from 'axios';
import LoadingAnimation from '../components/LoadingAnimation';
import GeneratePostButton from '../components/GeneratePostButton';

// API Keys and endpoints (replace with secure environment variables in production)
const AZURE_GPT4_API_KEY = "Fj1KPt7grC6bAkNja7daZUstpP8wZTXsV6Zjr2FOxkO7wsBQ5SzQJQQJ99BCACHYHv6XJ3w3AAAAACOGL3Xg";
const GPT4_ENDPOINT = 'https://ai-aihackthonhub282549186415.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview';
const DALLE_ENDPOINT = 'https://chrlin-openai02.openai.azure.com/openai/deployments/dall-e-3/images/generations?api-version=2024-02-01';
// For DALLE, we use the provided API key directly:
const AZURE_DALLE_API_KEY = '8FWd2D4me50VFU19E9jKXo1ABOO1M7Cr6c5GhFvP6sst2n3soQKuJQQJ99BCACYeBjFXJ3w3AAABACOGy8NL';

const defaultCharLimits = {
  Twitter: 280,
  Instagram: 2200,
  LinkedIn: 1300,
  Facebook: 63206,
};

// Inline platform-specific styles
const PLATFORM_STYLES = {
  Twitter: {
    container: {
      backgroundColor: '#F6F8FA',
      border: '1px solid #E1E4E8',
      borderRadius: '12px',
      padding: '16px',
      maxWidth: '500px',
      margin: '0 auto',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    iconColor: '#1DA1F2',
    textColor: '#000000',
    maxHeight: '600px',
  },
  Instagram: {
    container: {
      background: 'linear-gradient(135deg, #FFDC80, #C13584)',
      borderRadius: '12px',
      padding: '16px',
      maxWidth: '400px',
      margin: '0 auto',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
    },
    iconColor: 'white',
    textColor: 'white',
    maxHeight: '800px',
  },
  LinkedIn: {
    container: {
      backgroundColor: 'white',
      border: '1px solid #D3D3D3',
      borderRadius: '12px',
      padding: '16px',
      maxWidth: '550px',
      margin: '0 auto',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    iconColor: '#0A66C2',
    textColor: '#000000',
    maxHeight: '700px',
  },
  Facebook: {
    container: {
      backgroundColor: '#F5F6F7',
      border: '1px solid #DADDE1',
      borderRadius: '12px',
      padding: '16px',
      maxWidth: '500px',
      margin: '0 auto',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    iconColor: '#1877F2',
    textColor: '#000000',
    maxHeight: '700px',
  },
};

const generateIcons = {
  Twitter: '🐦',
  Instagram: '📸',
  LinkedIn: '💼',
  Facebook: '👥',
};

const Dashboard = () => {
  // State for the generator inputs and results
  const [userPrompt, setUserPrompt] = useState('');
  const [postType, setPostType] = useState('Meme');
  const [platform, setPlatform] = useState('Instagram');
  const [wantImage, setWantImage] = useState(false);
  const [generatedPost, setGeneratedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper: Generate caption only using GPT-4
  const generateTextPost = async (finalPrompt, platform) => {
    const targetPlatform = platform ? platform.toLowerCase() : 'default';
    let captionUserMessage = `Generate a creative caption for the following prompt: "${finalPrompt}"`;
    
    switch (targetPlatform) {
      case 'instagram':
        captionUserMessage = `Generate a catchy, emoji-filled Instagram caption for the following prompt: "${finalPrompt}"`;
        break;
      case 'linkedin':
        captionUserMessage = `Generate a professional and engaging LinkedIn caption for the following prompt: "${finalPrompt}"`;
        break;
      case 'twitter':
        captionUserMessage = `Generate a short and punchy Twitter caption for the following prompt: "${finalPrompt}"`;
        break;
      case 'meme':
        captionUserMessage = `Generate a humorous and witty meme caption for the following prompt: "${finalPrompt}"`;
        break;
      default:
        captionUserMessage = `Generate a creative caption for the following prompt: "${finalPrompt}"`;
        break;
    }
    
    const response = await axios.post(
      GPT4_ENDPOINT,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a creative assistant that generates engaging social media captions.',
          },
          {
            role: 'user',
            content: captionUserMessage,
          },
        ],
        max_tokens: targetPlatform === 'twitter' ? 30 : 50,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AZURE_GPT4_API_KEY}`,
        },
      }
    );
    
    return response.data.choices[0].message.content.trim();
  };

  // Helper: Generate caption and image using GPT-4 and DALL·E 3
  const generateImagePost = async (finalPrompt, platform) => {
    const targetPlatform = platform ? platform.toLowerCase() : 'default';
    let captionUserMessage = `Generate a creative caption for the following prompt: "${finalPrompt}"`;
    let imagePrompt = `${finalPrompt} in a photo-realistic style`;
    
    switch (targetPlatform) {
      case 'instagram':
        captionUserMessage = `Generate a catchy, emoji-filled Instagram caption for the following prompt: "${finalPrompt}"`;
        imagePrompt = `${finalPrompt} in a realistic style with high detail, perfect for Instagram`;
        break;
      case 'linkedin':
        captionUserMessage = `Generate a professional and engaging LinkedIn caption for the following prompt: "${finalPrompt}"`;
        imagePrompt = `${finalPrompt} in a clean, photo-realistic style with professional lighting`;
        break;
      case 'twitter':
        captionUserMessage = `Generate a short and punchy Twitter caption for the following prompt: "${finalPrompt}"`;
        imagePrompt = `${finalPrompt} in a realistic style with clear details, perfect for Twitter`;
        break;
      case 'meme':
        captionUserMessage = `Generate a humorous and witty meme caption for the following prompt: "${finalPrompt}"`;
        imagePrompt = `${finalPrompt} in a funny, over-the-top, and slightly exaggerated style, ideal for a meme`;
        break;
      case 'advertisement':
        captionUserMessage = `Generate an eye-catching advertisement caption for the following prompt: "${finalPrompt}"`;
        imagePrompt = `${finalPrompt} with bold visuals, vibrant colors, and a strong call-to-action, perfect for an advertisement`;
        break;
      case 'announcement':
        captionUserMessage = `Generate an engaging announcement caption for the following prompt: "${finalPrompt}"`;
        imagePrompt = `${finalPrompt} with clear, professional visuals and a formal tone, ideal for an announcement`;
        break;
      default:
        captionUserMessage = `Generate a creative caption for the following prompt: "${finalPrompt}"`;
        imagePrompt = `${finalPrompt} in a photo-realistic style`;
        break;
    }
    
    // Generate caption
    const captionResponse = await axios.post(
      GPT4_ENDPOINT,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a creative assistant that generates engaging social media captions.',
          },
          {
            role: 'user',
            content: captionUserMessage,
          },
        ],
        max_tokens: targetPlatform === 'twitter' ? 30 : 50,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AZURE_GPT4_API_KEY}`,
        },
      }
    );
    const caption = captionResponse.data.choices[0].message.content.trim();

    // Generate image
    const imageResponse = await axios.post(
      DALLE_ENDPOINT,
      {
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_DALLE_API_KEY,
        },
      }
    );
    const imageUrl = imageResponse.data.data[0].url;
    
    return { caption, imageUrl };
  };

  // Merged handler: Generate post and display preview in dashboard
  const handleGeneratePost = async () => {
    if (!userPrompt.trim()) {
      setError("Please enter a prompt!");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Build a final prompt including post type and platform info
      const defaultLimit = defaultCharLimits[platform] || '';
      const finalPrompt = `Generate a ${postType} post for ${platform} (default limit: ${defaultLimit} characters). Content prompt: "${userPrompt}"`;

      let result;
      if (wantImage) {
        result = await generateImagePost(finalPrompt, platform);
        // Normalize the result to always have a 'content' property
        result = { content: result.caption, imageUrl: result.imageUrl };
      } else {
        const caption = await generateTextPost(finalPrompt, platform);
        result = { content: caption };
      }
      
      setGeneratedPost(result);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      const errorMessage = err.response
        ? `Error: ${err.response.status} - ${err.response.data.error?.message || 'Unknown API error'}`
        : 'Network error or API call failed';
      setError(errorMessage);
      setGeneratedPost(null);
    } finally {
      setLoading(false);
    }
  };

  // Component for inline post preview with platform-specific styling
  const PlatformPostPreview = ({ platform, content, imageUrl }) => {
    const currentPlatform = PLATFORM_STYLES[platform];
    return (
      <div style={{ ...currentPlatform.container, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '24px', marginRight: '10px' }}>
            {generateIcons[platform]}
          </span>
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: currentPlatform.textColor }}>
            {platform} Post Preview
          </span>
        </div>
        <div style={{ color: currentPlatform.textColor, maxHeight: currentPlatform.maxHeight, overflowY: 'auto' }}>
          {imageUrl && (
            <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <img
                src={imageUrl}
                alt="Generated Post Visual"
                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
              />
            </div>
          )}
          <p style={{ fontSize: '16px', marginBottom: '12px' }}>{content}</p>
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.6 }}>
          Characters: {content.length} / {defaultCharLimits[platform]}
        </div>
      </div>
    );
  };

  return (
    <section
      className="page dashboard-page"
      style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}
    >
      <div className="dashboard-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 className="dashboard-title" style={{ fontSize: '28px', marginBottom: '5px', color: '#333' }}>
          Social Media Post Generator
        </h2>
        <p className="dashboard-subtitle" style={{ fontSize: '18px', color: '#555' }}>
          Create AI-powered social media content
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
        {/* Generator Section */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Post Prompt</label>
              <input
                type="text"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Enter creative prompt for post generation"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Post Type</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="Meme">Meme</option>
                <option value="Personal">Personal Post</option>
                <option value="Advertisement">Advertisement</option>
                <option value="Announcement">Announcement</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                {Object.keys(PLATFORM_STYLES).map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '12px' }}>
                Character Limit: {defaultCharLimits[platform]}
              </small>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={wantImage} onChange={(e) => setWantImage(e.target.checked)} />
              <label>Include an AI-generated image? (Text is mandatory)</label>
            </div>

            <GeneratePostButton loading={loading} onClick={handleGeneratePost} />

            {error && (
              <div
                style={{
                  backgroundColor: '#FED7D7',
                  border: '1px solid #FEB2B2',
                  color: '#9B2C2C',
                  padding: '10px',
                  borderRadius: '6px',
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div style={{ flex: 1 }}>
          {generatedPost ? (
            <PlatformPostPreview
              platform={platform}
              content={generatedPost.content}
              imageUrl={generatedPost.imageUrl}
            />
          ) : (
            <div
              style={{
                backgroundColor: '#F7FAFC',
                borderRadius: '12px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#718096' }}>Your post preview will appear here after generation</p>
            </div>
          )}
        </div>
      </div>
      {loading && <LoadingAnimation />}
    </section>
  );
};

export default Dashboard;
