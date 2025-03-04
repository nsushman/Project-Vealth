import React, { useEffect, useState, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { ArrowUpCircle, ArrowDownCircle } from "react-feather"; // Import icons

export default function Home() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [weeklyCashFlow, setWeeklyCashFlow] = useState(0);
  const [cards, setCards] = useState([]);
  const [youtubeLink, setYoutubeLink] = useState("");
  const carouselRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (loggedInUser) => {
      if (loggedInUser) {
        console.log("User logged in:", loggedInUser.uid);
        setUser(loggedInUser);

        // ✅ Fetch user accounts
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

          // ✅ Calculate total balance across all accounts
          totalBal = userAccounts.reduce((sum, acc) => sum + acc.balance, 0);
          setTotalBalance(totalBal);

          // ✅ Sort accounts: Goals first, sorted by goal end date
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

        // ✅ Fetch cash flow (transactions in the last 7 days)
        const transactionsRef = collection(db, "transactions");
        const transactionsSnapshot = await getDocs(transactionsRef);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let cashFlow = 0;
        transactionsSnapshot.docs.forEach(doc => {
          const transaction = doc.data();
          const transactionDate = new Date(transaction.timestamp);

          if (transactionDate >= oneWeekAgo && userAccounts.some(acc => acc.id === transaction.to_account || acc.id === transaction.from_account)) {
            if (transaction.to_account) {
              cashFlow += transaction.amount; // Incoming money
            } else if (transaction.from_account) {
              cashFlow -= transaction.amount; // Outgoing money
            }
          }
        });

        setWeeklyCashFlow(cashFlow);

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

  // ✅ Function to get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="container mt-4">
      {/* ✅ User Summary Section */}
      {user && (
        <div className="bg-primary text-white p-4 mb-4 rounded text-center">
          <div className="d-flex align-items-center justify-content-center">
            {/* Profile Icon */}
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
              <h4 className="mb-0">{getGreeting()}, {user.displayName}</h4>
              <p className="mb-1">Total Balance: <strong>${totalBalance.toFixed(2)}</strong></p>
              <p className="mb-0">
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

      {/* ✅ Account Cards Section (Sorted) */}
      <div className="mb-4">
        {accounts.map(account => (
          <div key={account.id} className="mb-3">
            <div className="card shadow-lg">
              <div className="card-body text-center">
                <h5 className="card-title">{account.account_name}</h5>
                <p className="card-text">💰 Balance: ${account.balance.toFixed(2)}</p>
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
          <a href={youtubeLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
}
