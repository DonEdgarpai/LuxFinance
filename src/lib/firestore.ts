import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Interfaces
interface Transaction {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  type: 'expense' | 'income';
}

interface IncomeGoal {
  id: string;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
  currentAmount: number;
  notes: string[];
}

interface Reminder {
  id: string;
  title: string;
  date: string;
  description: string;
  notes: string[];
}

// Transactions
export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const docRef = await addDoc(transactionsRef, {
    ...transaction,
    date: Timestamp.fromDate(new Date(transaction.date))
  });
  return { id: docRef.id, ...transaction };
};

export const fetchTransactions = async (userId: string): Promise<Transaction[]> => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const snapshot = await getDocs(transactionsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: (doc.data().date as Timestamp).toDate().toISOString()
  } as Transaction));
};

export const updateTransaction = async (userId: string, transactionId: string, transaction: Partial<Transaction>) => {
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
  await updateDoc(transactionRef, {
    ...transaction,
    date: transaction.date ? Timestamp.fromDate(new Date(transaction.date)) : undefined
  });
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
  await deleteDoc(transactionRef);
};

// Income Goals
export const addIncomeGoal = async (userId: string, incomeGoal: Omit<IncomeGoal, 'id'>) => {
  const goalsRef = collection(db, 'users', userId, 'incomeGoals');
  const docRef = await addDoc(goalsRef, {
    ...incomeGoal,
    date: Timestamp.fromDate(new Date(incomeGoal.date)),
    createdAt: Timestamp.now()
  });
  return { id: docRef.id, ...incomeGoal };
};

export const fetchIncomeGoals = async (userId: string): Promise<IncomeGoal[]> => {
  const goalsRef = collection(db, 'users', userId, 'incomeGoals');
  const snapshot = await getDocs(goalsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: (doc.data().date as Timestamp).toDate().toISOString(),
    createdAt: (doc.data().createdAt as Timestamp).toDate().toISOString()
  } as IncomeGoal));
};

export const updateIncomeGoal = async (userId: string, goalId: string, goal: Partial<IncomeGoal>) => {
  const goalRef = doc(db, 'users', userId, 'incomeGoals', goalId);
  await updateDoc(goalRef, {
    ...goal,
    date: goal.date ? Timestamp.fromDate(new Date(goal.date)) : undefined
  });
};

export const deleteIncomeGoal = async (userId: string, goalId: string) => {
  const goalRef = doc(db, 'users', userId, 'incomeGoals', goalId);
  await deleteDoc(goalRef);
};

// Reminders
export const addReminder = async (userId: string, reminder: Omit<Reminder, 'id'>) => {
  const remindersRef = collection(db, 'users', userId, 'reminders');
  const docRef = await addDoc(remindersRef, {
    ...reminder,
    date: Timestamp.fromDate(new Date(reminder.date))
  });
  return { id: docRef.id, ...reminder };
};

export const fetchReminders = async (userId: string): Promise<Reminder[]> => {
  const remindersRef = collection(db, 'users', userId, 'reminders');
  const snapshot = await getDocs(remindersRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: (doc.data().date as Timestamp).toDate().toISOString()
  } as Reminder));
};

export const updateReminder = async (userId: string, reminderId: string, reminder: Partial<Reminder>) => {
  const reminderRef = doc(db, 'users', userId, 'reminders', reminderId);
  await updateDoc(reminderRef, {
    ...reminder,
    date: reminder.date ? Timestamp.fromDate(new Date(reminder.date)) : undefined
  });
};

export const deleteReminder = async (userId: string, reminderId: string) => {
  const reminderRef = doc(db, 'users', userId, 'reminders', reminderId);
  await deleteDoc(reminderRef);
};

// Helper function to convert Firestore Timestamp to ISO string
export const convertTimestampToISOString = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString();
};

// Helper function to convert ISO string to Firestore Timestamp
export const convertISOStringToTimestamp = (isoString: string): Timestamp => {
  return Timestamp.fromDate(new Date(isoString));
};