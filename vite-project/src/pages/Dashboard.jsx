// --- API Keys and Endpoints (IMPORTANT: Use environment variables in production!) ---
const DALLE_ENDPOINT = import.meta.env.VITE_DALLE_ENDPOINT;
const AZURE_GPT4_API_KEY = import.meta.env.VITE_AZURE_GPT4_API_KEY;
const GPT4_ENDPOINT = import.meta.env.VITE_GPT4_ENDPOINT;
const AZURE_DALLE_API_KEY = import.meta.env.VITE_AZURE_DALLE_API_KEY;
console.log(
  "API Keys Loaded (Should be undefined/masked in production builds if using env vars correctly):",
  AZURE_GPT4_API_KEY ? 'GPT Key Loaded' : 'GPT Key MISSING',
  GPT4_ENDPOINT ? 'GPT Endpoint Loaded' : 'GPT Endpoint MISSING',
  DALLE_ENDPOINT ? 'DALL-E Endpoint Loaded' : 'DALL-E Endpoint MISSING',
  AZURE_DALLE_API_KEY ? 'DALL-E Key Loaded' : 'DALL-E Key MISSING'
);

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
// Make sure these paths are correct for your project structure
import LoadingAnimation from "../components/LoadingAnimation";
import GeneratePostButton from "../components/GeneratePostButton";

// --- Default Character Limits ---
const defaultCharLimits = {
  Twitter: 280,
  Instagram: 2200,
  LinkedIn: 1300,
  Facebook: 63206,
};

// --- Base Styles ---
const colors = {
  primary: "#007bff", primaryHover: "#0056b3", light: "#f8f9fa", white: "#ffffff",
  border: "#dee2e6", textDark: "#343A40", textMedium: "#6C757D", textLight: "#adb5bd",
  errorBg: "#f8d7da", errorText: "#721c24", errorBorder: "#f5c6cb", success: "#28a745",
};
const spacing = {
  xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px",
};
const shadows = {
  soft: "0 4px 12px rgba(0, 0, 0, 0.06)", medium: "0 6px 16px rgba(0, 0, 0, 0.08)",
};
const borderRadius = "8px";
const inputHeight = "45px";

// --- Platform Styles ---
const PLATFORM_STYLES = {
  Twitter: { container: { backgroundColor: "#F6F8FA", border: `1px solid ${colors.border}`, borderRadius: borderRadius, padding: spacing.lg, maxWidth: "550px", margin: "0 auto", boxShadow: shadows.soft, }, iconColor: "#1DA1F2", textColor: colors.textDark, maxHeight: "600px", },
  Instagram: { container: { background: "linear-gradient(135deg, #FFDC80, #F56040, #C13584)", borderRadius: borderRadius, padding: spacing.lg, maxWidth: "500px", margin: "0 auto", color: colors.white, boxShadow: shadows.medium, }, iconColor: colors.white, textColor: colors.white, maxHeight: "800px", },
  LinkedIn: { container: { backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: borderRadius, padding: spacing.lg, maxWidth: "600px", margin: "0 auto", boxShadow: shadows.soft, }, iconColor: "#0A66C2", textColor: colors.textDark, maxHeight: "700px", },
  Facebook: { container: { backgroundColor: "#F0F2F5", border: `1px solid ${colors.border}`, borderRadius: borderRadius, padding: spacing.lg, maxWidth: "550px", margin: "0 auto", boxShadow: shadows.soft, }, iconColor: "#1877F2", textColor: colors.textDark, maxHeight: "700px", },
};

const generateIcons = {
  Twitter: "🐦", Instagram: "📸", LinkedIn: "💼", Facebook: "👥",
};

// --- Helper Functions ---
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);
  const copyToClipboard = (text) => {
    if (!navigator.clipboard) {
        // Basic fallback - might not work in all scenarios (e.g., HTTPS)
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed"; // Avoid scrolling
            textArea.style.left = "-9999px"; // Move off-screen
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 1500);
        } catch (err) {
            console.error("Fallback copy failed", err);
            // Optionally set an error state here
        }
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true); setTimeout(() => setIsCopied(false), 1500);
    }).catch((err) => { console.error("Could not copy text: ", err); });
  };
  return [isCopied, copyToClipboard];
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  // State
  const [userPrompt, setUserPrompt] = useState("");
  const [postType, setPostType] = useState("Personal");
  const [platform, setPlatform] = useState("LinkedIn"); // Defaulting to LinkedIn for example consistency
  const [wantImage, setWantImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [generatedPost, setGeneratedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCopied, copyToClipboard] = useCopyToClipboard();

  // Refs
  const fileInputRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    // Cleanup Object URL when component unmounts or preview changes
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  // --- Handlers ---
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setError(null); // Clear errors on new selection
    if (file && file.type.startsWith("image/")) {
      if (file.size > 4 * 1024 * 1024) { // 4MB Limit
        setError("Image file is too large (Max 4MB for Vision API). Please choose a smaller image.");
        setUploadedImage(null);
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input visually
  };

  // --- API Call Logic ---
  const generateCaptionWithGPT4 = async (messages, platform) => {
      if (!GPT4_ENDPOINT || !AZURE_GPT4_API_KEY) {
          throw new Error("GPT-4 API endpoint or key is not configured.");
      }
      const max_tokens = defaultCharLimits[platform] ? Math.min(500, defaultCharLimits[platform] + 50) : 500; // Increased token limit slightly

      console.log("Sending to GPT-4:", { messages, max_tokens });

      try {
        const response = await axios.post(
            GPT4_ENDPOINT,
            { messages: messages, max_tokens: max_tokens, temperature: 0.7 },
            {
                headers: { "Content-Type": "application/json", "api-key": AZURE_GPT4_API_KEY },
                timeout: 90000 // 90 second timeout
            }
        );

        console.log("GPT-4 Raw Response:", response.data);

        const content = response.data.choices?.[0]?.message?.content?.trim();
        if (content) { return content; }
        else {
            // Try to extract error message from response if available
            const errorDetail = response.data?.choices?.[0]?.error || response.data?.error || "No content in response.";
            console.error("Unexpected API response structure or empty content:", response.data);
            throw new Error(`Invalid response structure or empty content from GPT-4 API. Detail: ${JSON.stringify(errorDetail)}`);
        }
      } catch (error) {
          console.error("Error calling GPT-4 API:", error);
          if (axios.isAxiosError(error) && error.response) {
              console.error("GPT-4 API Error Details:", error.response.data);
          }
          throw error; // Re-throw to be caught by handleGeneratePost
      }
  };

  const generateImageWithDalle = async (imagePrompt) => {
      if (!DALLE_ENDPOINT || !AZURE_DALLE_API_KEY) {
          throw new Error("DALL-E API endpoint or key is not configured.");
      }
      console.log("Sending to DALL-E:", { prompt: imagePrompt });
      try {
        const response = await axios.post(
            DALLE_ENDPOINT,
            { prompt: imagePrompt, n: 1, size: "1024x1024" }, // Ensure size is supported
            {
                headers: { "Content-Type": "application/json", "api-key": AZURE_DALLE_API_KEY },
                timeout: 120000 // 120 second timeout
            }
        );
        console.log("DALL-E Raw Response:", response.data);

        // Adjust based on *your specific* Azure DALL-E response structure
        const imageUrl = response.data.data?.[0]?.url || response.data.result?.data?.[0]?.url;

        if (imageUrl) { return imageUrl; }
        else if (response.data.id && response.headers['operation-location']) {
             console.warn("DALL-E returned an operation ID. Polling not implemented.");
             throw new Error("DALL-E generation started (async), but polling for result is not implemented.");
        } else {
            console.error("Unexpected DALL-E response structure:", response.data);
            throw new Error("Invalid response structure from DALL-E API. Could not find image URL.");
        }
      } catch(error) {
          console.error("Error calling DALL-E API:", error);
          if (axios.isAxiosError(error) && error.response) {
              console.error("DALL-E API Error Details:", error.response.data);
          }
          throw error;
      }
  };

  // --- Main Generation Handler ---
  const handleGeneratePost = async () => {
    if (!userPrompt.trim() && !uploadedImage) { setError("Please enter a prompt OR upload an image."); return; }
    // Key checks
    if (uploadedImage && (!GPT4_ENDPOINT || !AZURE_GPT4_API_KEY)) { setError("Error: Azure GPT-4 Vision API endpoint or key missing."); return; }
    if (!uploadedImage && wantImage && (!DALLE_ENDPOINT || !AZURE_DALLE_API_KEY)) { setError("Error: Azure DALL-E API endpoint or key missing."); return; }
    if (!uploadedImage && !wantImage && (!GPT4_ENDPOINT || !AZURE_GPT4_API_KEY)) { setError("Error: Azure GPT-4 API endpoint or key missing."); return; }

    setLoading(true); setError(null); setGeneratedPost(null);

    try {
      let result = {};
      const platformInfo = `${platform} (~${defaultCharLimits[platform]} chars)`;
      const postTypeInfo = postType;
      const baseSystemMessage = `You are an expert social media assistant for ${platform}. Write compelling, platform-specific content. Focus on engagement, clarity, and brand voice. Adhere closely to length constraints if provided (${platformInfo}). Use relevant emojis appropriately.`;

      if (uploadedImage) { // --- Image Upload Scenario ---
        console.log("Generating caption for uploaded image via GPT-4 Vision...");
        const base64Image = await fileToBase64(uploadedImage);
        const base64ImageData = base64Image.split(",")[1];
        let visionPromptText = `Analyze this image and generate an engaging ${postTypeInfo} caption for ${platformInfo}.`;
        if (userPrompt.trim()) { visionPromptText += ` Use this context/instruction: "${userPrompt}".`; }
        visionPromptText += ` Make it concise and impactful.`;
        const messages = [
          { role: "system", content: baseSystemMessage },
          { role: "user", content: [ { type: "text", text: visionPromptText }, { type: "image_url", image_url: { url: `data:${uploadedImage.type};base64,${base64ImageData}`, detail: "high" } } ] }
        ];
        const caption = await generateCaptionWithGPT4(messages, platform);
        result = { content: caption, imageUrl: imagePreviewUrl }; // Use local preview URL

      } else if (userPrompt.trim()) { // --- Text Prompt Scenario ---
        console.log("Generating based on text prompt...");
        const basePrompt = `User idea: "${userPrompt}"`;

        if (wantImage) { // --- Text + DALL-E Image ---
            console.log("Generating caption and DALL-E image...");
            // Simple prompt for DALL-E, could be refined by another GPT call
            let imageGenPrompt = `${userPrompt}, ${postTypeInfo} style, visually appealing for ${platform}`;
            if (platform === "Instagram") imageGenPrompt += `, vibrant colors, high detail`;
            if (platform === "LinkedIn") imageGenPrompt += `, professional setting, clean aesthetic`;
            console.log("Using DALL-E Prompt:", imageGenPrompt);

            let captionUserMessage = `Generate a ${postTypeInfo} post caption for ${platformInfo}. ${basePrompt}. The post will include an AI-generated image based on this idea. Make the caption complement the visual concept. Be engaging.`;

            const [caption, imageUrl] = await Promise.all([
                generateCaptionWithGPT4([{ role: "system", content: baseSystemMessage }, { role: "user", content: captionUserMessage }], platform),
                generateImageWithDalle(imageGenPrompt),
            ]);
            result = { content: caption, imageUrl: imageUrl };

        } else { // --- Text Only ---
          console.log("Generating caption only...");
          let captionUserMessage = `Generate a ${postTypeInfo} post caption for ${platformInfo}. ${basePrompt}. Make it engaging and suitable for the platform.`;
          const caption = await generateCaptionWithGPT4([{ role: "system", content: baseSystemMessage }, { role: "user", content: captionUserMessage }], platform);
          result = { content: caption };
        }
      }
      setGeneratedPost(result);
    } catch (err) { // --- Error Handling ---
        console.error("Error during generation process:", err);
        let errorMessage = "An unexpected error occurred during generation.";
        if (axios.isAxiosError(err)) {
            const status = err.response?.status; const data = err.response?.data;
            // Try to get a meaningful message
            const apiErrorMsg = data?.error?.message || (typeof data === 'string' ? data : JSON.stringify(data));
            errorMessage = `API Error (${status || 'Network Error'}): ${apiErrorMsg || err.message}`;
             if (data?.error?.code?.includes("content_filter") || apiErrorMsg?.includes("content management policy")) { errorMessage += " - Content safety policy violation."; }
             else if (data?.error?.code === "InvalidImageSize" || data?.error?.code === "InvalidImageUrl" || apiErrorMsg?.includes("InvalidImage")) { errorMessage += " - Image processing issue (check format/size)."; }
             else if (status === 401) { errorMessage = `API Error (401): Authentication failed. Check API Key.`; }
             else if (status === 404) { errorMessage = `API Error (404): Endpoint not found (${err.config.url}). Check Endpoint URL.`; }
             else if (status === 429) { errorMessage = "API Error (429): Rate limit/quota exceeded. Check Azure resource limits/usage."; }
             else if (!err.response) { errorMessage = `Network error: Could not reach API (${err.config.url}). Check connection/URL. (${err.message})`; }
        } else if (err instanceof Error) { errorMessage = `Error: ${err.message}`; }
        setError(errorMessage); setGeneratedPost(null); // Clear results on error
    } finally { setLoading(false); }
  };

  const downloadImage = async () => {
    if (!generatedPost || !generatedPost.imageUrl) { setError("No image URL available to download."); return; }
    const imageUrl = generatedPost.imageUrl;
    console.log("Attempting to download image from:", imageUrl);
    try {
      if (imageUrl.startsWith("blob:")) { // Local blob URL (from upload preview)
        const link = document.createElement("a"); link.href = imageUrl;
        const timestamp = new Date().toISOString().slice(0, 10);
        const safePrompt = userPrompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_");
        link.download = `uploaded_image_${platform}_${safePrompt || timestamp}.${uploadedImage?.type.split('/')[1] || 'jpg'}`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      } else { // External URL (likely from DALL-E)
        const response = await fetch(imageUrl); // Direct fetch might face CORS
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`); }
        const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url;
        const timestamp = new Date().toISOString().slice(0, 10); const safePrompt = userPrompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_");
        const extension = blob.type.split('/')[1] || 'jpg'; // Guess extension
        link.download = `generated_image_${platform}_${safePrompt || timestamp}.${extension}`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      }
    } catch (err) {
        console.error("Error downloading image:", err);
        // Provide more specific advice if CORS is suspected
        const corsErrorHint = err.message.includes('Failed to fetch') || err.message.includes('NetworkError') ? '(This might be a CORS issue if the image URL is cross-origin. A backend proxy might be needed for reliable downloads).' : '';
        setError(`Failed to download image. ${err.message}. ${corsErrorHint}`);
    }
  };

  // --- Inline Style Objects ---
  const styles = {
    page: { fontFamily: "'Poppins', sans-serif", backgroundColor: colors.light, minHeight: "100vh", padding: spacing.xl, },
    header: { textAlign: "center", marginBottom: spacing.xl, }, title: { fontSize: "2rem", fontWeight: "600", color: colors.textDark, marginBottom: spacing.sm, },
    subtitle: { fontSize: "1.125rem", color: colors.textMedium, marginBottom: spacing.lg, },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: spacing.xl, alignItems: "start", },
    panel: { backgroundColor: colors.white, borderRadius: borderRadius, padding: spacing.xl, boxShadow: shadows.soft, display: "flex", flexDirection: "column", gap: spacing.lg, height: "100%", boxSizing: "border-box", },
    label: { display: "block", marginBottom: spacing.sm, fontWeight: "500", fontSize: "0.9rem", color: colors.textMedium, },
    inputBase: { width: "100%", padding: `0 ${spacing.md}`, border: `1px solid ${colors.border}`, borderRadius: borderRadius, fontSize: "1rem", color: colors.textDark, boxSizing: "border-box", transition: "border-color 0.2s ease, box-shadow 0.2s ease", height: inputHeight, backgroundColor: colors.white, },
    textArea: { minHeight: "100px", resize: "vertical", paddingTop: spacing.md, paddingBottom: spacing.md, height: "auto", lineHeight: 1.5, },
    select: { appearance: "none", backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23${colors.textMedium.substring(1)}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`, backgroundRepeat: "no-repeat", backgroundPosition: `right ${spacing.md} center`, backgroundSize: "16px 12px", cursor: "pointer", },
    fileInput: { display: "block", width: "100%", fontSize: "0.9rem", padding: `${spacing.sm} ${spacing.md}`, border: `1px dashed ${colors.border}`, borderRadius: borderRadius, cursor: "pointer", backgroundColor: colors.light, lineHeight: '1.5', '::file-selector-button': { padding: `${spacing.xs} ${spacing.sm}`, marginRight: spacing.sm, border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.white, cursor: 'pointer',} },
    imagePreviewContainer: { position: "relative", marginTop: spacing.md, maxWidth: "250px", borderRadius: borderRadius, overflow: "hidden", boxShadow: shadows.soft, },
    imagePreview: { width: "100%", height: "auto", display: "block", }, // Used for the small preview in controls
    clearImageButton: { position: "absolute", top: spacing.sm, right: spacing.sm, background: "rgba(0,0,0,0.6)", color: colors.white, border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: "1", transition: "background-color 0.2s ease", zIndex: 1, },
    smallText: { color: colors.textMedium, fontSize: "0.8rem", display: "block", marginTop: spacing.xs, },
    hr: { border: "none", borderTop: `1px solid ${colors.border}`, margin: `${spacing.md} 0`, },
    checkboxContainer: { display: "flex", alignItems: "center", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.light, borderRadius: borderRadius, cursor: "pointer", },
    checkbox: { transform: "scale(1.2)", cursor: "pointer", accentColor: colors.primary, },
    checkboxLabel: { color: colors.textMedium, fontSize: "0.9rem", margin: 0, cursor: "pointer", userSelect: 'none', },
    errorBox: { backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.errorText, padding: spacing.md, borderRadius: borderRadius, fontSize: "0.9rem", wordBreak: "break-word", marginTop: spacing.sm, lineHeight: 1.5, },
    // Preview Specifics
    previewPlaceholder: { flexGrow: 1, backgroundColor: colors.light, border: `2px dashed ${colors.border}`, borderRadius: borderRadius, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: colors.textLight, minHeight: "300px", boxSizing: 'border-box', },
    previewLoading: { flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.light, borderRadius: borderRadius, minHeight: "300px", boxSizing: 'border-box', },
    placeholderIcon: { fontSize: "48px", marginBottom: spacing.md, color: colors.textLight, },
    placeholderText: { fontSize: "1rem", lineHeight: 1.5, },
    // Platform Preview Card Styles
    previewCardHeader: { display: "flex", alignItems: "center", marginBottom: spacing.md, paddingBottom: spacing.md, borderBottom: `1px solid rgba(128, 128, 128, 0.2)`, flexShrink: 0, },
    previewIcon: { fontSize: "28px", marginRight: spacing.md, },
    previewTitle: { fontWeight: "600", fontSize: "1.1rem", },
    // --- SCROLL AREA STYLE ---
    previewContentArea: { // This div grows and scrolls
        flexGrow: 1,
        overflowY: "auto",
        paddingRight: spacing.sm,
        paddingLeft: spacing.xs,
        paddingBottom: spacing.md,
        minHeight: 0, // Crucial for flex scrolling
    },
    // --- END SCROLL AREA STYLE ---
    previewImageWrapper: { position: "relative", marginBottom: spacing.md, borderRadius: borderRadius, overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", },
    previewImage: { // Style for the image *inside* the preview card
        width: "100%", height: "auto", display: "block", objectFit: "contain",
        maxHeight: "350px", // Limit image height (adjust value as needed)
    },
    downloadImageButton: { position: "absolute", top: spacing.sm, right: spacing.sm, background: "rgba(0,0,0,0.6)", color: colors.white, border: "none", borderRadius: "6px", width: "auto", height: "28px", cursor: "pointer", fontSize: "14px", padding: `0 ${spacing.sm}`, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: "1", transition: "background-color 0.2s ease, opacity 0.2s ease", opacity: 0.8, zIndex: 1, },
    previewText: { fontSize: "1rem", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", },
    previewFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: spacing.md, borderTop: `1px solid rgba(128, 128, 128, 0.1)`, fontSize: "0.8rem", opacity: 0.9, flexShrink: 0, }, // flexShrink is vital
    charCount: {},
    copyButton: { background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "0.8rem", padding: `${spacing.xs} ${spacing.sm}`, borderRadius: "4px", opacity: 0.7, transition: "opacity 0.2s ease, background-color 0.2s ease", },
    copyButtonCopied: { color: colors.success, opacity: 1, },
  };

  // --- PlatformPostPreview Component (Internal - CORRECTED STRUCTURE) ---
  const PlatformPostPreview = ({ platform, content, imageUrl, onDownloadImage }) => {
    const platformConfig = PLATFORM_STYLES[platform];
    const charLimit = defaultCharLimits[platform];
    const charCount = content?.length || 0;
    const isOverLimit = charLimit && charCount > charLimit;

    const dynamicStyles = { // Define dynamic styles based on platform
         previewTitle: { ...styles.previewTitle, color: platformConfig.textColor },
         previewContentArea: { ...styles.previewContentArea, color: platformConfig.textColor }, // Apply color to the scrollable area
         previewText: { ...styles.previewText }, // Color is inherited
         previewFooter: { ...styles.previewFooter, color: platformConfig.textColor },
         charCount: { ...styles.charCount, color: isOverLimit ? "red" : "inherit", fontWeight: isOverLimit ? 'bold': 'normal' },
         copyButton: { ...styles.copyButton, color: platformConfig.textColor },
         copyButtonCopied: { ...styles.copyButton, ...styles.copyButtonCopied },
         downloadImageButton: styles.downloadImageButton,
    };

    return (
        <div
            style={{
                ...platformConfig.container, // Platform bg, border, base padding, etc.
                maxHeight: platformConfig.maxHeight, // Overall card height limit
                margin: "0 auto", boxShadow: platformConfig.boxShadow || shadows.soft,
                display: "flex", flexDirection: "column", // Main layout: vertical flex
                overflow: "hidden", // Prevent root div scrolling
                boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div style={styles.previewCardHeader}>
                <span style={{ ...styles.previewIcon, color: platformConfig.iconColor }}>{generateIcons[platform]}</span>
                <span style={dynamicStyles.previewTitle}>{platform} Post Preview</span>
            </div>

            {/* Scrollable Content Area */}
            <div style={dynamicStyles.previewContentArea}> {/* This div has flexGrow:1, minHeight:0, overflowY:auto */}
                {imageUrl && (
                    <div style={styles.previewImageWrapper}>
                        <img src={imageUrl} alt="Generated/Uploaded Visual" style={styles.previewImage}/>
                        <button onClick={onDownloadImage} style={dynamicStyles.downloadImageButton} title="Download Image">⬇️ Download</button>
                    </div>
                )}
                <p style={dynamicStyles.previewText}>{content || "Caption will appear here..."}</p>
            </div>
            {/* End Scrollable Content Area */}

            {/* Footer */}
            <div style={dynamicStyles.previewFooter}>
                <span style={dynamicStyles.charCount}>
                    {charLimit ? `Chars: ${charCount}/${charLimit}` : `Chars: ${charCount}`}{" "}
                    {isOverLimit && <strong>(Over Limit!)</strong>}
                </span>
                {content && (
                    <button onClick={() => copyToClipboard(content)} style={isCopied ? dynamicStyles.copyButtonCopied : dynamicStyles.copyButton} title="Copy caption">
                        {isCopied ? "Copied!" : "📋 Copy"}
                    </button>
                )}
            </div>
        </div>
    );
  };


  // --- RENDER Main Dashboard ---
  return (
    <section style={styles.page}>
      <header style={styles.header}>
        <h2 style={styles.title}>AI Social Post Generator</h2>
        <p style={styles.subtitle}>Craft engaging content effortlessly</p>
      </header>

      <div style={styles.grid}>
        {/* --- Controls Panel --- */}
        <div style={styles.panel}>
            {/* Image Upload */}
            <div>
                 <label htmlFor="imageUploadInput" style={styles.label}>Upload Image (Optional)</label>
                 <input ref={fileInputRef} id="imageUploadInput" type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleImageChange} style={styles.fileInput} disabled={loading}/>
                 {imagePreviewUrl && ( <div style={styles.imagePreviewContainer}> <img src={imagePreviewUrl} alt="Upload Preview" style={styles.imagePreview}/> <button onClick={clearUploadedImage} style={styles.clearImageButton} title="Clear Image" disabled={loading}>×</button> </div> )}
                 <small style={styles.smallText}>Max 4MB. Caption based on image. Text prompt adds context.</small>
            </div>
            <hr style={styles.hr} />
            {/* Text Prompt */}
            <div>
                <label htmlFor="userPromptInput" style={styles.label}>{uploadedImage ? "Add Context (Optional)" : "Post Prompt (Required if no image)"}</label>
                <textarea id="userPromptInput" value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder={uploadedImage ? "e.g., Focus on atmosphere..." : "Enter topic, keywords..."} style={{ ...styles.inputBase, ...styles.textArea }} disabled={loading} rows={4} />
            </div>
            {/* Post Type */}
            <div>
                <label htmlFor="postTypeSelect" style={styles.label}>Post Type / Style</label>
                <select id="postTypeSelect" value={postType} onChange={(e) => setPostType(e.target.value)} style={{ ...styles.inputBase, ...styles.select }} disabled={loading}>
                    <option value="Personal">Personal Update</option> <option value="Engagement">Engagement Question</option> <option value="Informative">Informative / Tip</option> <option value="Promotional">Promotional</option> <option value="Advertisement">Advertisement</option> <option value="Announcement">Announcement</option> <option value="Meme">Meme / Humorous</option>
                </select>
            </div>
            {/* Platform */}
            <div>
                 <label htmlFor="platformSelect" style={styles.label}>Target Platform</label>
                 <select id="platformSelect" value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ ...styles.inputBase, ...styles.select }} disabled={loading}>
                    {Object.keys(PLATFORM_STYLES).map((plat) => (<option key={plat} value={plat}>{plat}{" "}{defaultCharLimits[plat] ? `(~${defaultCharLimits[plat]} chars)` : ""}</option>))}
                 </select>
            </div>
            {/* DALL-E Option */}
            {!uploadedImage && (
                <label htmlFor="wantImageCheck" style={styles.checkboxContainer} onClick={() => !loading && !uploadedImage && setWantImage(!wantImage)}>
                    <input type="checkbox" id="wantImageCheck" checked={wantImage} readOnly disabled={loading || !!uploadedImage} style={styles.checkbox} />
                    <span style={styles.checkboxLabel}>Generate image with DALL-E?</span>
                </label>
            )}
            {/* Generate Button */}
            <GeneratePostButton loading={loading} onClick={handleGeneratePost} disabled={loading || (!userPrompt.trim() && !uploadedImage)} style={{ width: "100%", marginTop: spacing.sm, height: inputHeight, }}>
                {loading ? "Generating..." : "✨ Generate Post"}
            </GeneratePostButton>
            {/* Error Display */}
            {error && ( <div style={styles.errorBox}><strong>Error:</strong> {error}</div> )}
        </div>

        {/* --- Preview Panel --- */}
        <div style={{ ...styles.panel, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {loading ? (
                <div style={{ ...styles.previewLoading, padding: styles.panel.padding /* Add padding back for centering */ }}> <LoadingAnimation /> </div>
            ) : generatedPost ? (
                <PlatformPostPreview platform={platform} content={generatedPost.content} imageUrl={generatedPost.imageUrl} onDownloadImage={downloadImage}/>
            ) : (
                <div style={{...styles.previewPlaceholder, padding: styles.panel.padding /* Add padding back for centering */ }}> <span style={styles.placeholderIcon}>🖼️✍️</span> <p style={styles.placeholderText}>Your beautifully crafted post preview <br /> will appear here.</p> </div>
            )}
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
