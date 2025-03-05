import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, addDoc } from "firebase/firestore"; // Firestore imports
import { db } from "../firebase"; // Import Firestore instance
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const [error, setError] = useState("");

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user; // Get logged-in user details

      // ✅ Check if the user already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        // ✅ If user doesn't exist, create a new record in Firestore
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          balance: 0,
          parentID: "",
          userType: "child",
        });
        console.log("New user created in Firestore:", user.email);
      } else {
        console.log("User already exists:", user.email);
      }

      // ✅ Check if user already has accounts
      const accountsRef = collection(db, "accounts");
      const accountsQuery = await getDocs(accountsRef);
      const userAccounts = accountsQuery.docs.filter(doc => doc.data().child_id === user.uid);

      let piggyBankId = null;
      let halloweenCostumeId = null;

      if (userAccounts.length === 0) {
        console.log("No accounts found for user. Creating default accounts...");

        // ✅ Create first account: "My Piggy Bank"
        const piggyBankRef = await addDoc(accountsRef, {
          child_id: user.uid, // Link to user
          account_name: "My Piggy Bank",
          balance: 335.10, // Default balance
        });
        piggyBankId = piggyBankRef.id;

        // ✅ Create second account: "Halloween Costume"
        const goalEndDate = new Date();
        goalEndDate.setDate(goalEndDate.getDate() + 10); // Add 10 days

        const halloweenCostumeRef = await addDoc(accountsRef, {
          child_id: user.uid, // Link to user
          account_name: "Halloween Costume",
          balance: 15.30, // Default balance
          goal_amount: 20.00, // Goal amount
          goal_end_date: goalEndDate.toISOString(), // Store as ISO string
        });
        halloweenCostumeId = halloweenCostumeRef.id;

        console.log("Default accounts created successfully.");
      } else {
        console.log("User already has accounts, skipping account creation.");
        userAccounts.forEach(account => {
          if (account.data().account_name === "My Piggy Bank") {
            piggyBankId = account.id;
          } else if (account.data().account_name === "Halloween Costume") {
            halloweenCostumeId = account.id;
          }
        });
      }

      // ✅ Check if user already has transactions
      const transactionsRef = collection(db, "transactions");
      const transactionsQuery = await getDocs(transactionsRef);
      const userTransactions = transactionsQuery.docs.filter(
        doc => doc.data().from_account === piggyBankId || doc.data().to_account === piggyBankId
      );

      if (userTransactions.length === 0) {
        console.log("No transactions found for user. Seeding transactions...");

        // ✅ Generate Transactions for "My Piggy Bank"
        let piggyBankBalance = 0;
        const transactionPromises = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3); // Go back 3 months

        for (let i = 0; i < 25; i++) {
          const transactionAmount = (Math.random() * 50 + 5).toFixed(2); // Random amount between $5 - $55
          const transactionType = i % 5 === 0 ? "Transfer from Parent" : "Purchase";
          const isIncome = transactionType === "Transfer from Parent";
          piggyBankBalance += isIncome ? parseFloat(transactionAmount) : -parseFloat(transactionAmount);

          const transactionDate = new Date(startDate);
          transactionDate.setDate(startDate.getDate() + Math.floor(Math.random() * 90)); // Random date in the last 3 months

          transactionPromises.push(
            addDoc(transactionsRef, {
              from_account: isIncome ? null : piggyBankId, // Outgoing transactions have from_account
              to_account: isIncome ? piggyBankId : null, // Incoming transactions have to_account
              amount: parseFloat(transactionAmount),
              transaction_type: isIncome ? "Deposit" : "Withdrawal",
              status: "Approved",
              timestamp: transactionDate.toISOString(),
              description: transactionType,
            })
          );
        }

        // Adjust to reach exactly $335.10
        const adjustment = 335.10 - piggyBankBalance;
        if (adjustment !== 0) {
          transactionPromises.push(
            addDoc(transactionsRef, {
              from_account: adjustment > 0 ? null : piggyBankId,
              to_account: adjustment > 0 ? piggyBankId : null,
              amount: Math.abs(adjustment),
              transaction_type: adjustment > 0 ? "Deposit" : "Withdrawal",
              status: "Approved",
              timestamp: new Date().toISOString(),
              description: "Balance Adjustment",
            })
          );
        }

        // ✅ Generate Transactions for "Halloween Costume"
        let halloweenBalance = 0;
        for (let i = 0; i < 3; i++) {
          const transactionAmount = (Math.random() * 5 + 3).toFixed(2); // Random amount between $3 - $8
          halloweenBalance += parseFloat(transactionAmount);

          transactionPromises.push(
            addDoc(transactionsRef, {
              from_account: null, // Income transactions for this
              to_account: halloweenCostumeId,
              amount: parseFloat(transactionAmount),
              transaction_type: "Deposit",
              status: "Approved",
              timestamp: new Date().toISOString(),
              description: "Savings Contribution",
            })
          );
        }

        // Adjust to reach exactly $15.30
        const adjustmentHalloween = 15.30 - halloweenBalance;
        if (adjustmentHalloween !== 0) {
          transactionPromises.push(
            addDoc(transactionsRef, {
              from_account: null,
              to_account: halloweenCostumeId,
              amount: Math.abs(adjustmentHalloween),
              transaction_type: "Deposit",
              status: "Approved",
              timestamp: new Date().toISOString(),
              description: "Final Contribution",
            })
          );
        }

        await Promise.all(transactionPromises);
        console.log("Transactions seeded successfully.");
      } else {
        console.log("User already has transactions, skipping transaction seeding.");
      }

      // ✅ Redirect to Home Page
      navigate("/home");
    } catch (err) {
      setError("Login failed: " + err.message);
    }
  };

  return (
    <div className="login-page">
      <button className="sso-btn" onClick={handleGoogleSignIn}>Continue with Google</button>
    </div>
  );
}
