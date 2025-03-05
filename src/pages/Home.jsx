import React, { useEffect, useState, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { ArrowUpCircle, ArrowDownCircle } from "react-feather";

export default function Home() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [weeklyCashFlow, setWeeklyCashFlow] = useState(0);
  const [cards, setCards] = useState([]);
  const [youtubeLink, setYoutubeLink] = useState("");
  const carouselRef = useRef(null);

  // Fetch user data, accounts, transactions and lesson details
  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (loggedInUser) => {
      if (loggedInUser) {
        setUser(loggedInUser);

        // Fetch user accounts
        const accountsRef = collection(db, "accounts");
        const accountsQuery = query(accountsRef, where("child_id", "==", loggedInUser.uid));
        const accountsSnapshot = await getDocs(accountsQuery);
        let userAccounts = [];
        let totalBal = 0;
        if (!accountsSnapshot.empty) {
          userAccounts = accountsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          totalBal = userAccounts.reduce((sum, acc) => sum + acc.balance, 0);
          setTotalBalance(totalBal);

          // Sort: accounts with goals come first, sorted by goal_end_date (if present)
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

        // Fetch cash flow (transactions in the last 7 days)
        const transactionsRef = collection(db, "transactions");
        const transactionsSnapshot = await getDocs(transactionsRef);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        let cashFlow = 0;
        transactionsSnapshot.docs.forEach(doc => {
          const transaction = doc.data();
          const transactionDate = new Date(transaction.timestamp);
          if (
            transactionDate >= oneWeekAgo &&
            userAccounts.some(acc => acc.id === transaction.to_account || acc.id === transaction.from_account)
          ) {
            if (transaction.to_account) {
              cashFlow += transaction.amount;
            } else if (transaction.from_account) {
              cashFlow -= transaction.amount;
            }
          }
        });
        setWeeklyCashFlow(cashFlow);

        // Fetch a random lesson
        const lessonsRef = collection(db, "lessons");
        const lessonsSnapshot = await getDocs(lessonsRef);
        if (!lessonsSnapshot.empty) {
          const lessons = lessonsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];
          setYoutubeLink(randomLesson.youtube_link || "");

          // Fetch lesson cards
          const cardsRef = collection(db, `lessons/${randomLesson.id}/cards`);
          const cardsSnapshot = await getDocs(cardsRef);
          if (!cardsSnapshot.empty) {
            setCards(cardsSnapshot.docs.map(doc => doc.data().content));
          }
        }
      }
    });
  }, []);

  // Enable Touch Swipe for Bootstrap Carousel
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

  // Function to calculate goal progress percentage
  const calculateProgress = (account) => {
    if (account.goal_amount) {
      return Math.min((account.balance / account.goal_amount) * 100, 100);
    } else if (account.goal_end_date) {
      const today = new Date();
      const goalDate = new Date(account.goal_end_date);
      const totalDays = Math.max(1, (goalDate - today) / (1000 * 60 * 60 * 24));
      // Assumes account.created_at is available for time-based goals
      const daysPassed = Math.max(0, (today - new Date(account.created_at)) / (1000 * 60 * 60 * 24));
      return Math.min((daysPassed / totalDays) * 100, 100);
    }
    return 0;
  };

  // Function to get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="container mt-4">
      {/* User Summary Section */}
      {user && (
        <div className="bg-primary text-white p-4 mb-4 rounded text-center">
          <div className="d-flex align-items-center justify-content-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-uppercase"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#fff",
                color: "#007bff",
                fontSize: "20px",
                fontWeight: "bold",
                marginRight: "15px"
              }}
            >
              {user.displayName ? user.displayName.charAt(0) : "U"}
            </div>
            <div>
              <h4>{`${getGreeting()}, ${user.displayName}`}</h4>
              <p>Total Balance: <strong>${totalBalance.toFixed(2)}</strong></p>
              <p>
                Weekly Cash Flow: <strong>${weeklyCashFlow.toFixed(2)}</strong>
                {weeklyCashFlow >= 0 ? (
                  <ArrowUpCircle className="text-success ms-2" size={20} />
                ) : (
                  <ArrowDownCircle className="text-danger ms-2" size={20} />
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Cards with Progress Bars (displayed one below the other) */}
      <div className="mb-4">
        {accounts.map(account => (
          <div key={account.id} className="mb-3">
            <div className="card shadow-lg">
              <div className="card-body text-center">
                <h5>{account.account_name}</h5>
                <p>💰 Balance: ${account.balance.toFixed(2)}</p>
                {(account.goal_amount || account.goal_end_date) && (
                  <>
                    {account.goal_amount && <p>🎯 Goal: ${account.goal_amount.toFixed(2)}</p>}
                    {account.goal_end_date && <p>📅 Goal Date: {new Date(account.goal_end_date).toLocaleDateString()}</p>}
                    <div className="progress mt-2">
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${calculateProgress(account)}%` }}
                        role="progressbar"
                        aria-valuenow={calculateProgress(account)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {`${Math.round(calculateProgress(account))}%`}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lesson Carousel with Indicators and Touch Swipe */}
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

          {/* Navigation Controls */}
          <button className="carousel-control-prev" type="button" data-bs-target="#lessonCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#lessonCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      ) : (
        <p className="text-center">Loading lesson cards...</p>
      )}

      {/* YouTube Link Section */}
      {youtubeLink && (
        <div className="text-center mt-4">
          <p><strong>Watch the full lesson:</strong></p>
          <a href={youtubeLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
}
