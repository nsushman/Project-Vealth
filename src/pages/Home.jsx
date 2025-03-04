import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // Ensure Bootstrap JS is loaded

export default function Home() {
  const [cards, setCards] = useState([]);
  const [youtubeLink, setYoutubeLink] = useState(""); // New state for YouTube link
  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchRandomLessonCards = async () => {
      try {
        // Fetch lessons
        const lessonsRef = collection(db, "lessons");
        const lessonsSnapshot = await getDocs(lessonsRef);

        if (lessonsSnapshot.empty) {
          console.log("No lessons found in Firestore.");
          return;
        }

        // Pick a random lesson
        const lessons = lessonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];

        // Store YouTube link
        setYoutubeLink(randomLesson.youtube_link || ""); // Store the YouTube link

        // Fetch cards for the selected lesson
        const cardsRef = collection(db, `lessons/${randomLesson.id}/cards`);
        const cardsSnapshot = await getDocs(cardsRef);

        if (cardsSnapshot.empty) {
          console.log("No cards found for this lesson.");
          return;
        }

        // Store lesson card contents
        const cardContents = cardsSnapshot.docs.map(doc => doc.data().content);
        setCards(cardContents);

      } catch (error) {
        console.error("Error fetching lesson cards:", error);
      }
    };

    fetchRandomLessonCards();
  }, []);

  // ✅ Enable Swipe Gestures for Mobile Users
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let startX = 0;
    let endX = 0;

    const handleTouchStart = (event) => {
      startX = event.touches[0].clientX;
    };

    const handleTouchMove = (event) => {
      endX = event.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (startX - endX > 50) {
        carousel.querySelector(".carousel-control-next").click();
      } else if (startX - endX < -50) {
        carousel.querySelector(".carousel-control-prev").click();
      }
    };

    carousel.addEventListener("touchstart", handleTouchStart);
    carousel.addEventListener("touchmove", handleTouchMove);
    carousel.addEventListener("touchend", handleTouchEnd);

    return () => {
      carousel.removeEventListener("touchstart", handleTouchStart);
      carousel.removeEventListener("touchmove", handleTouchMove);
      carousel.removeEventListener("touchend", handleTouchEnd);
    };
  }, [cards]);

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">You are in</h1>

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

          {/* Navigation Arrows */}
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#lessonCarousel"
            data-bs-slide="prev"
            style={{
              opacity: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              width: "10%",
            }}
          >
            <span className="carousel-control-prev-icon" aria-hidden="true" style={{ backgroundColor: "black" }}></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#lessonCarousel"
            data-bs-slide="next"
            style={{
              opacity: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              width: "10%",
            }}
          >
            <span className="carousel-control-next-icon" aria-hidden="true" style={{ backgroundColor: "black" }}></span>
            <span className="visually-hidden">Next</span>
          </button>
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
