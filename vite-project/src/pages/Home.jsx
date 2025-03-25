/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import LoadingAnimation from "../components/LoadingAnimation";
import AuthForms from "../components/AuthForms";

const Home = ({ setPage }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);

  return (
    <section
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "40px 20px",
        fontFamily: "'Arial', sans-serif",
      }}
    >
      {/* Extended Hero Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "1200px",
          margin: "0 auto 60px auto",
          flexWrap: "wrap",
          gap: "30px",
        }}
      >
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#2c3e50",
              lineHeight: "1.2",
              marginBottom: "20px",
            }}
          >
            The Ultimate Social Media Tool to Skyrocket Your Growth 10X
          </h1>
          <p
            style={{
              fontSize: "20px",
              color: "#7f8c8d",
              marginBottom: "30px",
              maxWidth: "500px",
            }}
          >
            Create stunning, ready-to-post creatives in seconds with our
            AI-powered platform designed for creators, marketers, and
            businesses.
          </p>
          <button
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#2980b9")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#3498db")}
            onClick={() => setPage("dashboard")}
          >
            Create Posts with AI for FREE NOW!
          </button>
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "15px",
              flexWrap: "wrap",
              color: "#34495e",
            }}
          >
            <span>⭐ 3k+ Reviews</span>
            <span style={{ fontWeight: "bold" }}>Google</span>
            <span style={{ fontWeight: "bold" }}>G2</span>
            <span style={{ fontWeight: "bold" }}>Product Hunt</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: "300px", textAlign: "center" }}>
          <img
            src="https://github.com/officialadityaaa/resources/blob/main/image%20(29).jpg?raw=true"
            alt="Hero"
            style={{
              maxWidth: "100%",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
        </div>
      </div>

      {/* Extended Marketing Content */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 80px auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "36px",
            color: "#2c3e50",
            marginBottom: "20px",
            fontWeight: "600",
          }}
        >
          Why Choose SocialGenAI?
        </h2>
        <p
          style={{
            fontSize: "18px",
            color: "#7f8c8d",
            maxWidth: "800px",
            margin: "0 auto 40px auto",
            lineHeight: "1.6",
          }}
        >
          Leverage our cutting-edge AI technology to craft high-quality social
          media posts, memes, ads, and product promotions effortlessly. Save
          hours of work, boost engagement, and elevate your digital marketing
          strategy to new heights with SocialGenAI.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "30px",
          }}
        >
          <div
            style={{
              padding: "20px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                color: "#3498db",
                marginBottom: "10px",
              }}
            >
              AI Meme Maker
            </h3>
            <p
              style={{ fontSize: "16px", color: "#7f8c8d", lineHeight: "1.5" }}
            >
              Generate hilarious, viral memes tailored to your audience in
              seconds.
            </p>
          </div>
          <div
            style={{
              padding: "20px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                color: "#3498db",
                marginBottom: "10px",
              }}
            >
              Social Media Ads
            </h3>
            <p
              style={{ fontSize: "16px", color: "#7f8c8d", lineHeight: "1.5" }}
            >
              Design eye-catching ads that drive conversions and sales
              effortlessly.
            </p>
          </div>
          <div
            style={{
              padding: "20px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                color: "#3498db",
                marginBottom: "10px",
              }}
            >
              Post Templates
            </h3>
            <p
              style={{ fontSize: "16px", color: "#7f8c8d", lineHeight: "1.5" }}
            >
              Explore a vast library of customizable templates for every social
              platform.
            </p>
          </div>
          <div
            style={{
              padding: "20px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                color: "#3498db",
                marginBottom: "10px",
              }}
            >
              Analytics Integration
            </h3>
            <p
              style={{ fontSize: "16px", color: "#7f8c8d", lineHeight: "1.5" }}
            >
              Track performance and optimize your content with built-in
              analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Login/Signup Options */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "60px",
        }}
      ></div>

      {showAuth && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#fff",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
        >
          <AuthForms
            onAuthSuccess={(userData) => {
              setUser(userData);
              setShowAuth(false);
            }}
            setShowForm={setShowAuth}
          />
        </div>
      )}

      {/* Extended Testimonials Section */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 80px auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "36px",
            color: "#2c3e50",
            marginBottom: "30px",
            fontWeight: "600",
          }}
        >
          Trusted by Thousands of Creators Worldwide
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "30px",
          }}
        >
          <div
            style={{
              padding: "25px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                color: "#7f8c8d",
                lineHeight: "1.6",
                marginBottom: "15px",
              }}
            >
              "SocialGenAI transformed my Instagram strategy—10x growth in just
              months!"
            </p>
            <span style={{ fontWeight: "bold", color: "#34495e" }}>
              - John D., Influencer
            </span>
          </div>
          <div
            style={{
              padding: "25px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                color: "#7f8c8d",
                lineHeight: "1.6",
                marginBottom: "15px",
              }}
            >
              "The AI Meme Maker took our brand engagement to the next level."
            </p>
            <span style={{ fontWeight: "bold", color: "#34495e" }}>
              - Sarah K., Marketing Lead
            </span>
          </div>
          <div
            style={{
              padding: "25px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                color: "#7f8c8d",
                lineHeight: "1.6",
                marginBottom: "15px",
              }}
            >
              "Professional posts in minutes—what more could a creator ask for?"
            </p>
            <span style={{ fontWeight: "bold", color: "#34495e" }}>
              - Priya R., Content Creator
            </span>
          </div>
          <div
            style={{
              padding: "25px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                color: "#7f8c8d",
                lineHeight: "1.6",
                marginBottom: "15px",
              }}
            >
              "The templates saved me hours of design work every week."
            </p>
            <span style={{ fontWeight: "bold", color: "#34495e" }}>
              - Alex M., Entrepreneur
            </span>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          backgroundColor: "#3498db",
          color: "#fff",
          borderRadius: "12px",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{ fontSize: "40px", fontWeight: "bold", marginBottom: "20px" }}
        >
          Ready to Revolutionize Your Social Media Presence?
        </h2>
        <p
          style={{
            fontSize: "20px",
            marginBottom: "30px",
            maxWidth: "700px",
            margin: "0 auto 30px auto",
          }}
        >
          Join SocialGenAI today and unlock the power of AI to create
          captivating posts, grow your audience, and dominate your niche.
        </p>
      </div>

      {/* Uncomment if you want to include the loading animation */}
      {/* <LoadingAnimation /> */}
    </section>
  );
};

export default Home;
