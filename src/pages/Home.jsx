import React, { useEffect, useState, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function Home() {
  const [accounts, setAccounts] = useState([]); // Store user accounts
  const [cards, setCards] = useState([]);
  const [youtubeLink, setYoutubeLink] = useState(""); // YouTube lesson link
  const carouselRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User logged in:", user.uid);

        // ✅ Fetch user accounts
        const accountsRef = collection(db, "accounts");
        const accountsQuery = query(accountsRef, where("child_id", "==", user.uid));
        const accountsSnapshot = await getDocs(accountsQuery);

        if (!accountsSnapshot.empty) {
          let userAccounts = accountsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          // ✅ Sort accounts:
          // - Accounts with goals come first
          // - Accounts with goals are sorted by the nearest goal_end_date
          userAccounts.sort((a, b) => {
            if (a.goal_end_date && !b.goal_end_date) return -1;
            if (!a.goal_end_date && b.goal_end_date) return 1;
            if (a.goal_end_date && b.goal_end_date) {
              return new Date(a.goal_end_date) - new Date(b.goal_end_date);
            }
            return 0;
          });

          setAccounts(userAccounts);
        }

        // ✅ Fetch a random lesson
        const lessonsRef = collection(db, "lessons");
        const lessonsSnapshot = await getDocs(lessonsRef);

        if (!lessonsSnapshot.empty) {
          const lessons = lessonsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];

          setYoutubeLink(randomLesson.youtube_link || "");

          // ✅ Fetch lesson cards
          const cardsRef = collection(db, `lessons/${randomLesson.id}/cards`);
          const cardsSnapshot = await getDocs(cardsRef);

          if (!cardsSnapshot.empty) {
            setCards(cardsSnapshot.docs.map(doc => doc.data().content));
          }
        }
      }
    });
  }, []);

  // ✅ Function to calculate goal progress percentage
  const calculateProgress = (account) => {
    if (account.goal_amount) {
      // ✅ Money-based goal progress
      return Math.min((account.balance / account.goal_amount) * 100, 100);
    } else if (account.goal_end_date) {
      // ✅ Time-based goal progress
      const today = new Date();
      const goalDate = new Date(account.goal_end_date);
      const totalDays = Math.max(1, (goalDate - today) / (1000 * 60 * 60 * 24)); // Prevent division by zero
      const daysPassed = Math.max(0, (new Date() - today) / (1000 * 60 * 60 * 24));
      return Math.min((daysPassed / totalDays) * 100, 100);
    }
    return 0;
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">You are in</h1>

      {/* ✅ Account Cards Section (Sorted) */}
      <div className="mb-4">
        {accounts.map(account => (
          <div key={account.id} className="mb-3">
            <div className="card shadow-lg">
              <div className="card-body text-center">
                <h5 className="card-title">{account.account_name}</h5>
                <p className="card-text">💰 Balance: ${account.balance.toFixed(2)}</p>

                {/* ✅ Display goal progress bar if applicable */}
                {account.goal_amount || account.goal_end_date ? (
                  <>
                    {account.goal_amount && <p className="card-text">🎯 Goal: ${account.goal_amount.toFixed(2)}</p>}
                    {account.goal_end_date && <p className="card-text">📅 Goal Date: {new Date(account.goal_end_date).toLocaleDateString()}</p>}

                    <div className="progress mt-2">
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${calculateProgress(account)}%` }}
                        aria-valuenow={calculateProgress(account)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {`${Math.round(calculateProgress(account))}%`}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Lesson Carousel */}
      {cards.length > 0 ? (
        <div id="lessonCarousel" className="carousel slide" ref={carouselRef} data-bs-interval="false">
          {/* Carousel Indicators */}
          <div className="carousel-indicators">
            {cards.map((_, index) => (
              <button
                key={index}
                type="button"
                data-bs-target="#lessonCarousel"
                data-bs-slide-to={index}
                className={index === 0 ? "active" : ""}
                aria-current={index === 0 ? "true" : "false"}
                aria-label={`Slide ${index + 1}`}
                style={{ backgroundColor: "#007bff", width: "10px", height: "10px", borderRadius: "50%" }}
              ></button>
            ))}
          </div>

          {/* Carousel Inner */}
          <div className="carousel-inner">
            {cards.map((content, index) => (
              <div key={index} className={`carousel-item ${index === 0 ? "active" : ""}`}>
                <div className="card mx-auto shadow-lg" style={{ width: "18rem", padding: "20px", textAlign: "center" }}>
                  <div className="card-body">
                    <p className="card-text">{content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center">Loading lesson cards...</p>
      )}

      {/* ✅ YouTube Link Section */}
      {youtubeLink && (
        <div className="text-center mt-4">
          <p><strong>Watch the full lesson:</strong></p>
          <a
            href={youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
}
