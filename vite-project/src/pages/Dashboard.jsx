
// --- API Keys and Endpoints (IMPORTANT: Use environment variables in production!) ---

// --- End API Keys ---
const DALLE_ENDPOINT = import.meta.env.VITE_DALLE_ENDPOINT;
const AZURE_GPT4_API_KEY = import.meta.env.VITE_AZURE_GPT4_API_KEY;
const GPT4_ENDPOINT = import.meta.env.VITE_GPT4_ENDPOINT;
// For DALLE, we use the provided API key directly:
const AZURE_DALLE_API_KEY = import.meta.env.VITE_AZURE_DALLE_API_KEY;
console.log(AZURE_GPT4_API_KEY, GPT4_ENDPOINT, DALLE_ENDPOINT, AZURE_DALLE_API_KEY);

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LoadingAnimation from '../components/LoadingAnimation'; // Adjust path if needed
import GeneratePostButton from '../components/GeneratePostButton'; // Adjust path if needed


// --- End Security Warning ---

const defaultCharLimits = {
    Twitter: 280,
    Instagram: 2200,
    LinkedIn: 1300,
    Facebook: 63206,
};

// --- Base Styles --- (Define some common values to reuse)
const colors = {
    primary: '#007bff', // A nice blue
    primaryHover: '#0056b3',
    light: '#f8f9fa',    // Very light gray background
    white: '#ffffff',
    border: '#dee2e6',   // Light gray border
    textDark: '#343A40', // Dark gray text
    textMedium: '#6C757D', // Medium gray text
    textLight: '#adb5bd',
    errorBg: '#f8d7da',
    errorText: '#721c24',
    errorBorder: '#f5c6cb',
    success: '#28a745',
};

const spacing = {
    xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px'
};

const shadows = {
    soft: '0 4px 12px rgba(0, 0, 0, 0.06)',
    medium: '0 6px 16px rgba(0, 0, 0, 0.08)',
};

const borderRadius = '8px';
const inputHeight = '45px'; // Consistent height for inputs/selects

// --- Platform Styles --- (Slightly adjusted for consistency)
const PLATFORM_STYLES = {
    Twitter: { container: { backgroundColor: '#F6F8FA', border: `1px solid ${colors.border}`, borderRadius: borderRadius, padding: spacing.lg, maxWidth: '550px', margin: '0 auto', boxShadow: shadows.soft }, iconColor: '#1DA1F2', textColor: colors.textDark, maxHeight: '600px' },
    Instagram: { container: { background: 'linear-gradient(135deg, #FFDC80, #F56040, #C13584)', borderRadius: borderRadius, padding: spacing.lg, maxWidth: '500px', margin: '0 auto', color: colors.white, boxShadow: shadows.medium }, iconColor: colors.white, textColor: colors.white, maxHeight: '800px' },
    LinkedIn: { container: { backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: borderRadius, padding: spacing.lg, maxWidth: '600px', margin: '0 auto', boxShadow: shadows.soft }, iconColor: '#0A66C2', textColor: colors.textDark, maxHeight: '700px' },
    Facebook: { container: { backgroundColor: '#F0F2F5', border: `1px solid ${colors.border}`, borderRadius: borderRadius, padding: spacing.lg, maxWidth: '550px', margin: '0 auto', boxShadow: shadows.soft }, iconColor: '#1877F2', textColor: colors.textDark, maxHeight: '700px' },
};

const generateIcons = {
    Twitter: '🐦', Instagram: '📸', LinkedIn: '💼', Facebook: '👥',
};

// --- Helper Functions ---
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
});

// Clipboard API Hook
const useCopyToClipboard = () => {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = (text) => {
        if (!navigator.clipboard) {
            console.warn('Clipboard API not available');
            // Fallback maybe? (less reliable)
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed'; // Avoid scrolling
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 1500); // Reset after 1.5s
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 1500); // Reset after 1.5s
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    };

    return [isCopied, copyToClipboard];
};


// --- Main Dashboard Component ---
const Dashboard = () => {
    // State
    const [userPrompt, setUserPrompt] = useState('');
    const [postType, setPostType] = useState('Personal');
    const [platform, setPlatform] = useState('Instagram');
    const [wantImage, setWantImage] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [generatedPost, setGeneratedPost] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    // Refs for focus management or other interactions if needed
    const fileInputRef = useRef(null);

    // --- Effects ---
    useEffect(() => {
        return () => { // Cleanup Object URL
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        };
    }, [imagePreviewUrl]);

    // --- Handlers ---
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        setError(null); // Clear errors on new selection
        if (file && file.type.startsWith('image/')) {
            if (file.size > 4 * 1024 * 1024) { // Example: Limit size to 4MB for base64
                setError("Image file is too large (Max 4MB for Vision API). Please choose a smaller image.");
                setUploadedImage(null);
                if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                setImagePreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
                return;
            }
            setUploadedImage(file);
            const previewUrl = URL.createObjectURL(file);
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); // Revoke previous before setting new
            setImagePreviewUrl(previewUrl);
            setWantImage(false); // Disable DALL-E if uploading
        } else {
            setUploadedImage(null);
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
            setImagePreviewUrl(null);
            if (file) setError("Please select a valid image file (JPG, PNG, GIF, WEBP).");
        }
    };

    const clearUploadedImage = () => {
        setUploadedImage(null);
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    };

    // --- API Call Logic (Keep existing logic, ensure headers/endpoints are correct) ---
      // Helper: Generate caption using GPT-4 (Text or Vision)
      const generateCaptionWithGPT4 = async (messages, platform) => {
        // ... (Keep your existing axios call logic here)
        // Ensure 'api-key' header is used for Azure
          const targetPlatform = platform ? platform.toLowerCase() : 'default';
          const max_tokens = targetPlatform === 'twitter' ? 80 : 200; // Slightly more generous limits

          const response = await axios.post(
            GPT4_ENDPOINT, // Ensure this points to your VISION-ENABLED deployment
            { messages: messages, max_tokens: max_tokens },
            { headers: { 'Content-Type': 'application/json', 'api-key': AZURE_GPT4_API_KEY } }
          );
          if (response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
              return response.data.choices[0].message.content.trim();
          } else {
              console.error("Unexpected API response structure:", response.data);
              throw new Error("Invalid response structure from GPT-4 API. Check logs.");
          }
      };

      // Helper: Generate image using DALL·E 3
      const generateImageWithDalle = async (imagePrompt) => {
         // ... (Keep your existing axios call logic here)
         // Ensure 'api-key' header is used for Azure
          const response = await axios.post(
            DALLE_ENDPOINT,
            { prompt: imagePrompt, n: 1, size: '1024x1024' }, // Ensure size is supported
            { headers: { 'Content-Type': 'application/json', 'api-key': AZURE_DALLE_API_KEY } }
          );
          if (response.data.data && response.data.data.length > 0) {
              return response.data.data[0].url;
          } else {
               console.error("Unexpected DALL-E response structure:", response.data);
              throw new Error("Invalid response structure from DALL-E API.");
          }
      };

    // --- Main Generation Handler ---
    const handleGeneratePost = async () => {
        if (!userPrompt.trim() && !uploadedImage) {
            setError("Please enter a prompt OR upload an image.");
            return;
        }
        setLoading(true);
        setError(null);
        setGeneratedPost(null);

        try {
            let result = {};
            const platformInfo = `${platform} (Limit: ${defaultCharLimits[platform]})`;
            const postTypeInfo = postType;

            if (uploadedImage) { // --- Image Upload Scenario ---
                console.log("Generating caption for uploaded image...");
                const base64Image = await fileToBase64(uploadedImage);
                const base64ImageData = base64Image.split(',')[1];

                let visionPromptText = `Generate a creative and engaging ${postTypeInfo} caption for this image, suitable for ${platformInfo}.`;
                if (userPrompt.trim()) {
                    visionPromptText += ` Additional context or instructions: "${userPrompt}"`;
                }
                 visionPromptText += ` Keep the caption concise and impactful, respecting the platform's style. Use relevant emojis where appropriate. Avoid generic phrases unless they fit the context.`;


                const messages = [
                    { role: 'system', content: `You are an expert social media assistant specializing in writing compelling, platform-specific captions based on images and user context for ${platform}. Focus on engagement and clarity.` },
                    { role: 'user', content: [
                        { type: 'text', text: visionPromptText },
                        { type: 'image_url', image_url: { "url": `data:${uploadedImage.type};base64,${base64ImageData}`, "detail": "high" } } // Added detail high
                    ]}
                ];

                const caption = await generateCaptionWithGPT4(messages, platform);
                result = { content: caption, imageUrl: imagePreviewUrl };

            } else if (userPrompt.trim()) { // --- Text Prompt Scenario ---
                console.log("Generating based on text prompt...");
                const basePrompt = `User idea: "${userPrompt}"`;
                let captionUserMessage = `Generate a ${postTypeInfo} post caption for ${platformInfo}. ${basePrompt}. Make it engaging and suitable for the platform. Use relevant emojis.`;
                const systemMessage = `You are a creative assistant generating engaging social media content for ${platform} based on user prompts.`;

                if (wantImage) { // --- Text + DALL-E Image ---
                     captionUserMessage = `Generate a caption for a ${postTypeInfo} post on ${platformInfo}. The post will feature an AI-generated image based on the idea: "${userPrompt}". Make the caption complement the visual described. Be concise and engaging. Use relevant emojis.`;
                     console.log("Generating image with DALL-E...");
                     let imageGenPrompt = `${userPrompt}, ${postTypeInfo} style, visually appealing for ${platform}`;
                        // Platform specific tweaks for DALL-E
                        if (platform === 'Instagram') imageGenPrompt += `, vibrant colors, high detail, photographic quality`;
                        if (platform === 'LinkedIn') imageGenPrompt += `, professional setting, clean aesthetic, realistic`;
                        if (platform === 'Twitter') imageGenPrompt += `, clear subject, meme format if post type is Meme, otherwise informative visual`;
                        if (platform === 'Facebook') imageGenPrompt += `, engaging scene, relatable, clear message`;
                        if (postType === 'Meme') imageGenPrompt += `, funny internet meme style, humorous concept`;
                        if (postType === 'Advertisement') imageGenPrompt += `, product focus, eye-catching, commercial photography style`;

                     const [caption, imageUrl] = await Promise.all([
                        generateCaptionWithGPT4([{ role: 'system', content: systemMessage }, { role: 'user', content: captionUserMessage }], platform),
                        generateImageWithDalle(imageGenPrompt)
                     ]);
                     result = { content: caption, imageUrl: imageUrl };

                } else { // --- Text Only ---
                    const caption = await generateCaptionWithGPT4([{ role: 'system', content: systemMessage }, { role: 'user', content: captionUserMessage }], platform);
                    result = { content: caption };
                }
            }

            setGeneratedPost(result);

        } catch (err) {
            console.error("Error during generation:", err);
            let errorMessage = 'An unexpected error occurred during generation.';
             if (axios.isAxiosError(err)) {
                if (err.response) {
                    console.error("API Error:", err.response.data);
                    const apiError = err.response.data?.error?.message || JSON.stringify(err.response.data);
                    errorMessage = `API Error (${err.response.status}): ${apiError}`;
                    if (err.response.data?.error?.code?.includes('ccessibility')) {
                         errorMessage += " - The image might contain content that violates safety policies.";
                    } else if (err.response.data?.error?.code === 'InvalidImageSize' || err.response.data?.error?.code === 'InvalidImageUrl') {
                         errorMessage += " - Please check the image format or size (max 4MB recommended for Vision).";
                    } else if (err.response.status === 401) {
                         errorMessage = "API Error (401): Authentication failed. Please check your API Key.";
                    } else if (err.response.status === 404) {
                        errorMessage = "API Error (404): Endpoint not found. Please check your API Endpoint URL.";
                    } else if (err.response.status === 429) {
                         errorMessage = "API Error (429): Rate limit exceeded. Please wait and try again.";
                    }
                } else if (err.request) {
                    errorMessage = 'Network error: Could not reach the API server. Check connection and endpoint URL.';
                } else {
                    errorMessage = `Request setup error: ${err.message}`;
                }
            } else if (err instanceof Error) {
                errorMessage = `Error: ${err.message}`;
            }
            setError(errorMessage);
            setGeneratedPost(null);
        } finally {
            setLoading(false);
        }
    };

    // --- Inline Style Objects --- (Define styles here for better readability)
    const styles = {
        page: {
            fontFamily: "'Poppins', sans-serif",
            backgroundColor: colors.light,
            minHeight: '100vh',
            padding: spacing.xl,
        },
        header: {
            textAlign: 'center',
            marginBottom: spacing.xl,
        },
        title: {
            fontSize: '2rem', // 32px
            fontWeight: '600',
            color: colors.textDark,
            marginBottom: spacing.sm,
        },
        subtitle: {
            fontSize: '1.125rem', // 18px
            color: colors.textMedium,
            marginBottom: spacing.lg,
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', // Min width 400px
            gap: spacing.xl,
            alignItems: 'start', // Align items to the top of their grid cell
        },
        panel: {
            backgroundColor: colors.white,
            borderRadius: borderRadius,
            padding: spacing.xl,
            boxShadow: shadows.soft,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.lg, // Space between elements inside panel
            height: '100%', // Make panels fill grid cell height
            boxSizing: 'border-box',
        },
        label: {
            display: 'block',
            marginBottom: spacing.sm,
            fontWeight: '500',
            fontSize: '0.9rem', // 14.4px
            color: colors.textMedium,
        },
        inputBase: {
            width: '100%',
            padding: `0 ${spacing.md}`, // Horizontal padding
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius,
            fontSize: '1rem',
            color: colors.textDark,
            boxSizing: 'border-box', // Include padding and border in width/height
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            height: inputHeight, // Consistent height
            backgroundColor: colors.white,
        },
        inputFocus: { // Define focus style separately (can't use pseudo-class inline)
           // Use JS to apply focus or rely on browser default + border/shadow
           // Example: outline: 'none', borderColor: colors.primary, boxShadow: `0 0 0 3px rgba(0, 123, 255, 0.1)`
        },
        textArea: {
             minHeight: '100px',
             resize: 'vertical',
             paddingTop: spacing.md, // Vertical padding for textarea
             paddingBottom: spacing.md,
             height: 'auto', // Override fixed height
        },
        select: {
           appearance: 'none', // Remove default arrow
           backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23${colors.textMedium.substring(1)}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`, // Custom arrow
           backgroundRepeat: 'no-repeat',
           backgroundPosition: `right ${spacing.md} center`,
           backgroundSize: '16px 12px',
           cursor: 'pointer',
        },
        fileInput: {
             display: 'block',
             width: '100%',
             fontSize: '0.9rem',
             padding: spacing.sm,
             border: `1px dashed ${colors.border}`,
             borderRadius: borderRadius,
             cursor: 'pointer',
             backgroundColor: colors.light,
        },
        imagePreviewContainer: {
             position: 'relative',
             marginTop: spacing.md,
             maxWidth: '250px',
             borderRadius: borderRadius,
             overflow: 'hidden',
             boxShadow: shadows.soft,
        },
        imagePreview: {
             width: '100%',
             height: 'auto',
             display: 'block',
        },
        clearImageButton: {
            position: 'absolute', top: spacing.sm, right: spacing.sm,
            background: 'rgba(0,0,0,0.6)', color: colors.white,
            border: 'none', borderRadius: '50%',
            width: '28px', height: '28px',
            cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: '1',
            transition: 'background-color 0.2s ease',
            '&:hover': { // Note: Pseudo-classes don't work directly in inline styles
                // Need JS or CSS Modules/Styled Components for hover
            }
        },
        smallText: {
             color: colors.textMedium,
             fontSize: '0.8rem', // 12.8px
             display: 'block',
             marginTop: spacing.xs,
        },
        hr: {
            border: 'none',
            borderTop: `1px solid ${colors.border}`,
            margin: `${spacing.md} 0`,
        },
        checkboxContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            backgroundColor: colors.light,
            borderRadius: borderRadius,
            cursor: 'pointer', // Make whole area clickable
        },
        checkbox: {
            transform: 'scale(1.2)',
            cursor: 'pointer',
        },
        checkboxLabel: {
            color: colors.textMedium,
            fontSize: '0.9rem',
            margin: 0, // Reset default margin
            cursor: 'pointer',
        },
        errorBox: {
            backgroundColor: colors.errorBg,
            border: `1px solid ${colors.errorBorder}`,
            color: colors.errorText,
            padding: spacing.md,
            borderRadius: borderRadius,
            fontSize: '0.9rem',
            wordBreak: 'break-word',
            marginTop: spacing.sm,
        },
        // Preview Panel Specifics
        previewPlaceholder: {
            flexGrow: 1,
            backgroundColor: colors.light,
            border: `2px dashed ${colors.border}`,
            borderRadius: borderRadius,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            textAlign: 'center',
            color: colors.textLight,
            minHeight: '300px', // Ensure it has some height
        },
        previewLoading: {
             flexGrow: 1,
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             backgroundColor: colors.light,
             borderRadius: borderRadius,
             padding: spacing.xl,
             minHeight: '300px',
        },
        placeholderIcon: {
            fontSize: '48px',
            marginBottom: spacing.md,
            color: colors.textLight,
        },
        placeholderText: {
            fontSize: '1rem',
            lineHeight: 1.5,
        },
        // Platform Preview (Inside Component)
         previewCardHeader: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: spacing.md,
            paddingBottom: spacing.md,
            borderBottom: `1px solid rgba(128, 128, 128, 0.2)`, // Subtle separator
        },
        previewIcon: {
            fontSize: '28px',
            marginRight: spacing.md,
        },
        previewTitle: {
            fontWeight: '600',
            fontSize: '1.1rem', // 17.6px
            // color will be set by PLATFORM_STYLES
        },
        previewContentArea: {
             // maxHeight will be set by PLATFORM_STYLES
             overflowY: 'auto',
             paddingRight: spacing.sm, // Space for scrollbar
             // Custom scrollbar (WebKit browsers)
             '&::-webkit-scrollbar': { width: '6px' },
             '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.05)', borderRadius: '3px' },
             '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.2)', borderRadius: '3px' },
             '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.3)' },
        },
        previewImageWrapper: {
            marginBottom: spacing.md,
            borderRadius: borderRadius,
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        previewImage: {
            width: '100%', height: 'auto', display: 'block', objectFit: 'cover',
        },
        previewText: {
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: spacing.md,
            whiteSpace: 'pre-wrap', // Preserve line breaks
            wordBreak: 'break-word',
            // color set by PLATFORM_STYLES
        },
        previewFooter: {
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center',
             marginTop: spacing.md,
             paddingTop: spacing.sm,
             borderTop: `1px solid rgba(128, 128, 128, 0.1)`,
             fontSize: '0.8rem',
             opacity: 0.9,
             // color set by PLATFORM_STYLES
        },
        charCount: {
             // color changes dynamically
        },
        copyButton: {
             background: 'none',
             border: 'none',
             color: 'inherit', // Inherit color from footer
             cursor: 'pointer',
             fontSize: '0.8rem',
             padding: `${spacing.xs} ${spacing.sm}`,
             borderRadius: '4px',
             opacity: 0.7,
             transition: 'opacity 0.2s ease, background-color 0.2s ease',
             '&:hover': { opacity: 1, backgroundColor: 'rgba(128, 128, 128, 0.1)' },
        },
        copyButtonCopied: {
             color: colors.success, // Green color when copied
             opacity: 1,
        }
    };

    // --- PlatformPostPreview Component (Internal) ---
    const PlatformPostPreview = ({ platform, content, imageUrl }) => {
        const platformConfig = PLATFORM_STYLES[platform];
        const charLimit = defaultCharLimits[platform];
        const charCount = content?.length || 0;
        const isOverLimit = charLimit && charCount > charLimit;

        // Apply dynamic text color for the platform
        const dynamicStyles = {
            previewTitle: { ...styles.previewTitle, color: platformConfig.textColor },
            previewContentArea: { ...styles.previewContentArea, color: platformConfig.textColor, maxHeight: platformConfig.maxHeight },
            previewText: { ...styles.previewText, color: platformConfig.textColor },
            previewFooter: { ...styles.previewFooter, color: platformConfig.textColor },
            charCount: { ...styles.charCount, color: isOverLimit ? 'red' : 'inherit' }, // Use red if over limit
            copyButton: { ...styles.copyButton, color: platformConfig.textColor },
            copyButtonCopied: { ...styles.copyButton, ...styles.copyButtonCopied } // Merge base and copied styles
        };

        return (
            <div style={{ ...platformConfig.container, ...styles.panel /* Apply base panel styles too */ }}>
                <div style={styles.previewCardHeader}>
                    <span style={{ ...styles.previewIcon, color: platformConfig.iconColor }}>
                        {generateIcons[platform]}
                    </span>
                    <span style={dynamicStyles.previewTitle}>
                        {platform} Post Preview
                    </span>
                </div>

                <div style={dynamicStyles.previewContentArea}>
                    {imageUrl && (
                        <div style={styles.previewImageWrapper}>
                            <img src={imageUrl} alt="Generated or Uploaded Visual" style={styles.previewImage} />
                        </div>
                    )}
                    <p style={dynamicStyles.previewText}>
                        {content || "Caption will appear here..."}
                    </p>
                </div>

                <div style={dynamicStyles.previewFooter}>
                     <span style={dynamicStyles.charCount}>
                        {charLimit ? `Chars: ${charCount} / ${charLimit}` : `Chars: ${charCount}`} {isOverLimit && '(Over Limit!)'}
                    </span>
                    {content && (
                         <button
                            onClick={() => copyToClipboard(content)}
                            style={isCopied ? dynamicStyles.copyButtonCopied : dynamicStyles.copyButton}
                            title="Copy caption"
                         >
                            {isCopied ? 'Copied!' : '📋 Copy'}
                        </button>
                    )}
                </div>
            </div>
        );
    };


    // --- Render ---
    return (
        <section style={styles.page}>
            <header style={styles.header}>
                <h2 style={styles.title}>AI Social Post Generator</h2>
                <p style={styles.subtitle}>Craft engaging content from text or images effortlessly</p>
            </header>

            <div style={styles.grid}>
                {/* --- Controls Panel --- */}
                <div style={styles.panel}>
                    {/* Image Upload */}
                    <div>
                        <label htmlFor="imageUploadInput" style={styles.label}>Upload Image (Optional)</label>
                        <input
                            ref={fileInputRef}
                            id="imageUploadInput"
                            type="file"
                            accept="image/png, image/jpeg, image/gif, image/webp" // Be more specific
                            onChange={handleImageChange}
                            style={styles.fileInput}
                            disabled={loading}
                        />
                        {imagePreviewUrl && (
                            <div style={styles.imagePreviewContainer}>
                                <img src={imagePreviewUrl} alt="Upload Preview" style={styles.imagePreview} />
                                <button onClick={clearUploadedImage} style={styles.clearImageButton} title="Clear Image" disabled={loading}>
                                    × {/* Simple X icon */}
                                </button>
                            </div>
                        )}
                        <small style={styles.smallText}>
                            Max 4MB. Caption generates based on image if provided. Text prompt adds context.
                        </small>
                    </div>

                    <hr style={styles.hr} />

                    {/* Text Prompt */}
                    <div>
                        <label htmlFor="userPromptInput" style={styles.label}>
                            {uploadedImage ? "Add Context / Instructions (Optional)" : "Post Prompt (Required if no image)"}
                        </label>
                        <textarea
                            id="userPromptInput"
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            placeholder={uploadedImage ? "e.g., Focus on the cheerful atmosphere, mention the new feature" : "Enter topic, keywords, or a full idea..."}
                            style={{ ...styles.inputBase, ...styles.textArea }} // Merge base and textarea styles
                            disabled={loading}
                            rows={4} // Suggest initial height
                        />
                    </div>

                    {/* Post Type */}
                    <div>
                        <label htmlFor="postTypeSelect" style={styles.label}>Post Type / Style</label>
                        <select
                            id="postTypeSelect"
                            value={postType}
                            onChange={(e) => setPostType(e.target.value)}
                            style={{ ...styles.inputBase, ...styles.select }} // Merge base and select styles
                            disabled={loading}
                        >
                            {/* Add more relevant types */}
                            <option value="Personal">Personal Update</option>
                            <option value="Engagement">Engagement Question</option>
                            <option value="Informative">Informative / Tip</option>
                            <option value="Promotional">Promotional</option>
                             <option value="Advertisement">Advertisement</option>
                            <option value="Announcement">Announcement</option>
                            <option value="Meme">Meme / Humorous</option>
                            
                        </select>
                    </div>

                    {/* Platform */}
                    <div>
                        <label htmlFor="platformSelect" style={styles.label}>Target Platform</label>
                        <select
                            id="platformSelect"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            style={{ ...styles.inputBase, ...styles.select }}
                            disabled={loading}
                        >
                            {Object.keys(PLATFORM_STYLES).map((plat) => (
                                <option key={plat} value={plat}>
                                    {plat} {defaultCharLimits[plat] ? `(~${defaultCharLimits[plat]} chars)` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* DALL-E Option */}
                    {!uploadedImage && (
                        <label htmlFor="wantImageCheck" style={styles.checkboxContainer}>
                            <input
                                type="checkbox"
                                id="wantImageCheck"
                                checked={wantImage}
                                onChange={(e) => setWantImage(e.target.checked)}
                                disabled={loading || !!uploadedImage}
                                style={styles.checkbox}
                            />
                            <span style={styles.checkboxLabel}>
                                Generate image with DALL-E? (Uses text prompt)
                            </span>
                        </label>
                    )}

                    {/* Generate Button */}
                    {/* Assuming GeneratePostButton accepts style, disabled, loading, onClick */}
                    <GeneratePostButton
                        loading={loading}
                        onClick={handleGeneratePost}
                        disabled={loading || (!userPrompt.trim() && !uploadedImage)} // Disable if no input
                        style={{ // Pass styles to the button component
                            backgroundColor: loading || (!userPrompt.trim() && !uploadedImage) ? colors.textLight : colors.primary,
                            color: colors.white,
                            padding: `${spacing.md} ${spacing.lg}`,
                            borderRadius: borderRadius,
                            border: 'none',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading || (!userPrompt.trim() && !uploadedImage) ? 'not-allowed' : 'pointer',
                            width: '100%',
                            marginTop: spacing.sm,
                            transition: 'background-color 0.2s ease',
                            height: inputHeight,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                       {loading ? 'Generating...' : '✨ Generate Post'}
                    </GeneratePostButton>


                    {/* Error Display */}
                    {error && (
                        <div style={styles.errorBox}>
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>

                {/* --- Preview Panel --- */}
                <div style={styles.panel}>
                    {loading ? (
                        <div style={styles.previewLoading}>
                            <LoadingAnimation />
                        </div>
                    ) : generatedPost ? (
                        <PlatformPostPreview
                            platform={platform}
                            content={generatedPost.content}
                            imageUrl={generatedPost.imageUrl}
                        />
                    ) : (
                        <div style={styles.previewPlaceholder}>
                            <span style={styles.placeholderIcon}>🖼️✍️</span>
                            <p style={styles.placeholderText}>
                                Your beautifully crafted post preview <br /> will appear here once generated.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Dashboard;
