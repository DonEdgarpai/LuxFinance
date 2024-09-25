/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Plus, DollarSign, Edit2, AlertTriangle, ChevronDown, ArrowUp, Trash2, Target, Calendar, BarChart2, Search, PieChartIcon, X, Wallet, TrendingUp, Shield, ChartPie, Clock, Zap, Bell } from 'lucide-react'
import { format, parseISO, isToday, startOfMonth, endOfMonth, isWithinInterval, isSameDay, isSameMonth, isBefore, addDays, differenceInDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import InitialLoadingScreen from './components/InitialLoadingScreen'

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']

interface Transaction {
  id: string
  category: string
  amount: number
  date: string
  description: string
  type: 'expense' | 'income'
}

interface IncomeGoal {
  id: string
  amount: number
  date: string
  description: string
  createdAt: string
  currentAmount: number
  notes: string[]
}

interface BudgetLimits {
  daily: number
  monthly: number
  custom: {
    amount: number
    startDate: string
    endDate: string
  }
}

interface Reminder {
  id: string
  title: string
  date: string
  description: string
  notes: string[]
}

export default function LandingPage() {
  const [expenses, setExpenses] = useState<Transaction[]>([
    { id: '1', category: 'Alimentación', amount: 400, date: new Date().toISOString().slice(0, 16), description: 'Compras del mes', type: 'expense' },
    { id: '2', category: 'Transporte', amount: 300, date: new Date().toISOString().slice(0, 16), description: 'Gasolina', type: 'expense' },
    { id: '3', category: 'Entretenimiento', amount: 200, date: new Date().toISOString().slice(0, 16), description: 'Cine', type: 'expense' },
    { id: '4', category: 'Otros', amount: 100, date: new Date().toISOString().slice(0, 16), description: 'Varios', type: 'expense' },
  ])
  const [incomes, setIncomes] = useState<Transaction[]>([
    { id: '1', category: 'Salario', amount: 3000, date: new Date().toISOString().slice(0, 16), description: 'Pago mensual', type: 'income' },
    { id: '2', category: 'Freelance', amount: 1000, date: new Date().toISOString().slice(0, 16), description: 'Proyecto extra', type: 'income' },
    { id: '3', category: 'Inversiones', amount: 500, date: new Date().toISOString().slice(0, 16), description: 'Dividendos', type: 'income' },
  ])
  const [newExpense, setNewExpense] = useState<Omit<Transaction, 'id' | 'type'>>({ category: '', amount: 0, date: new Date().toISOString().slice(0, 16), description: '' })
  const [newIncome, setNewIncome] = useState<Omit<Transaction, 'id' | 'type'>>({ category: '', amount: 0, date: new Date().toISOString().slice(0, 16), description: '' })
  const [activeExpenseChart, setActiveExpenseChart] = useState<'pie' | 'bar'>('pie')
  const [activeIncomeChart, setActiveIncomeChart] = useState<'pie' | 'bar'>('pie')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [editingExpenseCategory, setEditingExpenseCategory] = useState<string | null>(null)
  const [editingIncomeCategory, setEditingIncomeCategory] = useState<string | null>(null)
  const [expenseTimeFrame, setExpenseTimeFrame] = useState<'day' | 'month' | 'all'>('all')
  const [incomeTimeFrame, setIncomeTimeFrame] = useState<'day' | 'month' | 'all'>('all')
  const [expenseSummaryTimeFrame, setExpenseSummaryTimeFrame] = useState<'day' | 'month' | 'all'>('all')
  const [incomeSummaryTimeFrame, setIncomeSummaryTimeFrame] = useState<'day' | 'month' | 'all'>('all')
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimits>({
    daily: 100,
    monthly: 2000,
    custom: { amount: 0, startDate: '', endDate: '' }
  })
  const [showBudgetAlerts, setShowBudgetAlerts] = useState<string[]>([])
  const [showBudgetOptions, setShowBudgetOptions] = useState(false)
  const [customBudgetLimits, setCustomBudgetLimits] = useState<BudgetLimits['custom'][]>([])
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [incomeGoals, setIncomeGoals] = useState<IncomeGoal[]>([])
  const [newIncomeGoal, setNewIncomeGoal] = useState<Omit<IncomeGoal, 'id' | 'createdAt' | 'currentAmount' | 'notes'>>({ amount: 0, date: new Date().toISOString().slice(0, 10), description: '' })
  const [showAddIncomeGoal, setShowAddIncomeGoal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' })
  const [showSearchMenu, setShowSearchMenu] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCalculationResult, setShowCalculationResult] = useState(false)
  const [calculationResult, setCalculationResult] = useState({ expenses: 0, incomes: 0 })
  const [editingIncomeGoal, setEditingIncomeGoal] = useState<IncomeGoal | null>(null)
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [transactionTimeFrame, setTransactionTimeFrame] = useState<'day' | 'month' | 'all'>('all')
  const [expenseChartDate, setExpenseChartDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [incomeChartDate, setIncomeChartDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [balanceSummaryTimeFrame, setBalanceSummaryTimeFrame] = useState<'day' | 'month' | 'all'>('all')
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', title: 'Pagar factura de luz', date: addDays(new Date(), 7).toISOString().slice(0, 10), description: 'Pago mensual de electricidad', notes: [] },
    { id: '2', title: 'Renovar suscripción', date: addDays(new Date(), 14).toISOString().slice(0, 10), description: 'Renovación anual de streaming', notes: [] },
  ])
  const [isAddingReminder, setIsAddingReminder] = useState(false)
  const [reminderDraft, setReminderDraft] = useState<Omit<Reminder, 'id' | 'notes'>>({
    title: '',
    date: '',
    description: ''
  })
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingTransactionType, setEditingTransactionType] = useState<'expense' | 'income' | null>(null)
  const { isLoaded } = useUser()
  const [showLoading, setShowLoading] = useState(true)
  const [showInitialLoading, setShowInitialLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const handleEditCategory = (category: string, type: 'expense' | 'income') => {
    setEditingCategory(category)
    setEditingTransactionType(type)
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id))
  }
  
  const handleDeleteIncome = (id: string) => {
    setIncomes(prevIncomes => prevIncomes.filter(income => income.id !== id))
  }

  

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard')
    }
  }, [isSignedIn, router])

  useEffect(() => {
    console.log('LandingPage component mounted');
  }, []);




  useEffect(() => {
    setIsMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const { totalIncome, totalExpenses, totalBalance } = useMemo(() => {
    const calculateTotal = (transactions: Transaction[], timeFrame: 'day' | 'month' | 'all') => {
      return transactions.reduce((sum, transaction) => {
        if (timeFrame === 'day') {
          return isSameDay(parseISO(transaction.date), parseISO(selectedDate)) ? sum + transaction.amount : sum
        } else if (timeFrame === 'month') {
          return isSameMonth(parseISO(transaction.date), parseISO(selectedDate)) ? sum + transaction.amount : sum
        }
        return sum + transaction.amount
      }, 0)
    }
  
    const incomeTotal = calculateTotal(incomes, incomeSummaryTimeFrame)
    const expenseTotal = calculateTotal(expenses, expenseSummaryTimeFrame)
    const balanceTotal = calculateTotal(incomes, balanceSummaryTimeFrame) - calculateTotal(expenses, balanceSummaryTimeFrame)
  
    return { totalIncome: incomeTotal, totalExpenses: expenseTotal, totalBalance: balanceTotal }
  }, [incomes, expenses, incomeSummaryTimeFrame, expenseSummaryTimeFrame, balanceSummaryTimeFrame, selectedDate])

  const addExpense = () => {
    if (newExpense.category && newExpense.amount > 0) {
      const expenseData = {
        ...newExpense,
        amount: Math.abs(newExpense.amount),
        type: 'expense' as const,
        id: Date.now().toString()
      }
      setExpenses(prevExpenses => [...prevExpenses, expenseData])
      setNewExpense({ category: '', amount: 0, date: '', description: '' })
      toast.success("Gasto de prueba agregado (no guardado)")
    }
  }

  const addIncome = () => {
    if (newIncome.category && newIncome.amount > 0) {
      const incomeData = {
        ...newIncome,
        type: 'income' as const,
        id: Date.now().toString()
      }
      setIncomes(prevIncomes => [...prevIncomes, incomeData])
      setNewIncome({ category: '', amount: 0, date: '', description: '' })
      toast.success("Ingreso de prueba agregado (no guardado)")
    }
  }

  const saveEditedExpenses = (editedExpenses: Transaction[]) => {
    const updatedExpenses = expenses.map(expense => {
      const editedExpense = editedExpenses.find(e => e.id === expense.id)
      return editedExpense || expense
    })
    setExpenses(updatedExpenses)
    setEditingExpenseCategory(null)
  }

  const saveEditedIncomes = (editedIncomes: Transaction[]) => {
    const updatedIncomes = incomes.map(income => {
      const editedIncome = editedIncomes.find(i => i.id === income.id)
      return editedIncome || income
    })
    setIncomes(updatedIncomes)
    setEditingIncomeCategory(null)
  }

  const addExpenseToCategory = (category: string) => {
    setNewExpense({ ...newExpense, category })
    setShowAddExpense(true)
  }

  const addIncomeToCategory = (category: string) => {
    setNewIncome({ ...newIncome, category })
    setShowAddIncome(true)
  }

  const handleDeleteTransaction = useCallback((id: string, type: 'income' | 'expense') => {
    if (type === 'expense') {
      setExpenses(prevExpenses => prevExpenses.filter(e => e.id !== id))
    } else if (type === 'income') {
      setIncomes(prevIncomes => prevIncomes.filter(i => i.id !== id))
    }
  }, [])

  const deleteCategory = (category: string, type: 'expense' | 'income') => {
    if (type === 'expense') {
      setExpenses(expenses.filter(e => e.category !== category))
    } else if (type === 'income') {
      setIncomes(incomes.filter(i => i.category !== category))
    }
  }

  const getChartData = useCallback((data: Transaction[], timeFrame: 'day' | 'month' | 'all', selectedDate: string) => {
    const filteredData = data.filter(item => {
      const itemDate = toZonedTime(parseISO(item.date), 'America/Bogota')
      const selectedDateObj = toZonedTime(parseISO(selectedDate), 'America/Bogota')
      
      switch (timeFrame) {
        case 'day':
          return isSameDay(itemDate, selectedDateObj)
        case 'month':
          return isSameMonth(itemDate, selectedDateObj)
        case 'all':
        default:
          return true
      }
    })

    const groupedData = filteredData.reduce((acc, item) => {
      const date = toZonedTime(parseISO(item.date), 'America/Bogota')
      let key: string
      switch(timeFrame) {
        case 'day':
          key = format(date, 'HH:mm')
          break
        case 'month':
          key = format(date, 'dd')
          break
        case 'all':
        default:
          key = format(date, 'yyyy-MM-dd')
          break
      }
      if (!acc[key]) {
        acc[key] = { name: key, amount: 0, details: [] }
      }
      acc[key].amount += item.amount
      acc[key].details.push(`${item.category}: $${item.amount} - ${item.description}`)
      return acc
    }, {} as Record<string, { name: string, amount: number, details: string[] }>)

    return Object.values(groupedData).sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const getCategoryData = useCallback((transactions: Transaction[], timeFrame: 'day' | 'month' | 'all', selectedDate: string) => {
    const filteredTransactions = transactions.filter(item => {
      const itemDate = toZonedTime(parseISO(item.date), 'America/Bogota')
      const selectedDateObj = toZonedTime(parseISO(selectedDate), 'America/Bogota')
      
      switch (timeFrame) {
        case 'day':
          return isSameDay(itemDate, selectedDateObj)
        case 'month':
          return isSameMonth(itemDate, selectedDateObj)
        case 'all':
        default:
          return true
      }
    })

    const categoryData = filteredTransactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = { amount: 0, percentage: 0, count: 0 }
      }
      acc[transaction.category].amount += transaction.amount
      acc[transaction.category].count += 1
      return acc
    }, {} as Record<string, { amount: number, percentage: number, count: number }>)

    const total = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
    Object.keys(categoryData).forEach(category => {
      categoryData[category].percentage = Number((categoryData[category].amount / total * 100).toFixed(2))
    })

    return categoryData
  }, [])

  

  const expenseChartData = useMemo(() => getChartData(expenses, expenseTimeFrame, expenseChartDate), [expenses, expenseTimeFrame, expenseChartDate, getChartData])
  const incomeChartData = useMemo(() => getChartData(incomes, incomeTimeFrame, incomeChartDate), [incomes, incomeTimeFrame, incomeChartDate, getChartData])
  const expensesByCategory = useMemo(() => getCategoryData(expenses, expenseTimeFrame, expenseChartDate), [expenses, expenseTimeFrame, expenseChartDate, getCategoryData])
  const incomesByCategory = useMemo(() => getCategoryData(incomes, incomeTimeFrame, incomeChartDate), [incomes, incomeTimeFrame, incomeChartDate, getCategoryData])

    const scrollTo = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
        const offset = 80 // Ajusta este valor según sea necesario
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - offset

        window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
        })
    }
    }, [])

  

  const addCustomBudgetLimit = () => {
    if (budgetLimits.custom.amount > 0 && budgetLimits.custom.startDate && budgetLimits.custom.endDate) {
      setCustomBudgetLimits([...customBudgetLimits, { ...budgetLimits.custom }])
      setBudgetLimits({
        ...budgetLimits,
        custom: {
          amount: 0,
          startDate: '',
          endDate: ''
        }
      })
    }
  }

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleaddIncomeGoal = () => {
    if (newIncomeGoal.amount > 0 && newIncomeGoal.date) {
      const goalData: IncomeGoal = {
        ...newIncomeGoal,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        currentAmount: 0,
        notes: []
      }
      setIncomeGoals([...incomeGoals, goalData])
      setNewIncomeGoal({ amount: 0, date: new Date().toISOString().slice(0, 10), description: '' })
      setShowAddIncomeGoal(false)
    }
  }

  const calculateCustomRangeTotal = (type: 'expense' | 'income') => {
    const data = type === 'expense' ? expenses : incomes
    return data
      .filter(item => {
        const itemDate = parseISO(item.date)
        return isWithinInterval(itemDate, {
          start: parseISO(customDateRange.startDate),
          end: parseISO(customDateRange.endDate)
        })
      })
      .reduce((sum, item) => sum + item.amount, 0)
  }

  const getIncomeGoalProgress = (goal: IncomeGoal) => {
    return Math.min((goal.currentAmount / goal.amount) * 100, 100)
  }

  const filteredTransactions = useMemo(() => {
    return [...expenses, ...incomes].filter(transaction => {
      const matchesCategory = selectedCategory ? transaction.category === selectedCategory : true;
      const transactionDate = toZonedTime(parseISO(transaction.date), 'America/Bogota');
      const selectedDateObj = toZonedTime(parseISO(selectedDate), 'America/Bogota');
  
      let matchesTimeFrame = true;
      switch (transactionTimeFrame) {
        case 'day':
          matchesTimeFrame = format(transactionDate, 'yyyy-MM-dd') === format(selectedDateObj, 'yyyy-MM-dd');
          break;
        case 'month':
          matchesTimeFrame = format(transactionDate, 'yyyy-MM') === format(selectedDateObj, 'yyyy-MM');
          break;
        case 'all':
        default:
          matchesTimeFrame = true;
          break;
      }
  
      return matchesCategory && matchesTimeFrame;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, incomes, selectedCategory, transactionTimeFrame, selectedDate]);

  const handleUpdateIncomeGoal = (updatedGoal: IncomeGoal) => {
    setIncomeGoals(incomeGoals.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal))
    setEditingIncomeGoal(null)
  }

  const addNoteToIncomeGoal = (goalId: string, note: string) => {
    setIncomeGoals(incomeGoals.map(goal => {
      if (goal.id === goalId) {
        return { ...goal, notes: [...goal.notes, note] }
      }
      return goal
    }))
    setShowAddNote(false)
    setNewNote('')
  }

  const getFilteredCategories = useCallback(() => {
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = toZonedTime(parseISO(expense.date), 'America/Bogota')
      const selectedDateObj = toZonedTime(parseISO(selectedDate), 'America/Bogota')
      switch (transactionTimeFrame) {
        case 'day':
          return isSameDay(expenseDate, selectedDateObj)
        case 'month':
          return isSameMonth(expenseDate, selectedDateObj)
        case 'all':
        default:
          return true
      }
    })

    const filteredIncomes = incomes.filter(income => {
      const incomeDate = toZonedTime(parseISO(income.date), 'America/Bogota')
      const selectedDateObj = toZonedTime(parseISO(selectedDate), 'America/Bogota')
      switch (transactionTimeFrame) {
        case 'day':
          return isSameDay(incomeDate, selectedDateObj)
        case 'month':
          return isSameMonth(incomeDate, selectedDateObj)
        case 'all':
        default:
          return true
      }
    })

    const expenseCategories = Array.from(new Set(filteredExpenses.map(expense => expense.category)))
    const incomeCategories = Array.from(new Set(filteredIncomes.map(income => income.category)))
  
    return { expenseCategories, incomeCategories }
  }, [expenses, incomes, transactionTimeFrame, selectedDate])

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = event
    const { left, top } = currentTarget.getBoundingClientRect()
    setHoverPosition({ x: clientX - left, y: clientY - top })
  }, [])

  const HandlerAddReminder = () => {
    if (reminderDraft.title && reminderDraft.date) {
      const newReminder: Reminder = {
        ...reminderDraft,
        id: Date.now().toString(),
        notes: []
      }
      setReminders(prevReminders => [...prevReminders, newReminder])
      setReminderDraft({ title: '', date: '', description: '' })
      setIsAddingReminder(false)
    }
  }

  const updateReminderHandler = (updatedReminder: Reminder) => {
    setReminders(reminders.map(reminder => 
      reminder.id === updatedReminder.id ? updatedReminder : reminder
    ))
    setEditingReminder(null)
  }

  const HandlerDeleteReminder = (id: string) => {
    setReminders(reminders.filter(reminder => reminder.id !== id))
  }

  const addNoteToReminder = (reminderId: string, note: string) => {
    setReminders(reminders.map(reminder => {
      if (reminder.id === reminderId) {
        return { ...reminder, notes: [...reminder.notes, note] }
      }
      return reminder
    }))
  }

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [reminders])

  const upcomingReminders = useMemo(() => {
    const today = new Date()
    return sortedReminders.filter(reminder => isBefore(today, parseISO(reminder.date)))
  }, [sortedReminders])



  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }




  const handleUpdateTransaction = () => {
    if (editingTransaction) {
      const updatedTransactions = editingTransaction.type === 'expense'
        ? expenses.map(e => e.id === editingTransaction.id ? editingTransaction : e)
        : incomes.map(i => i.id === editingTransaction.id ? editingTransaction : i)

      if (editingTransaction.type === 'expense') {
        setExpenses(updatedTransactions as Transaction[])
      } else {
        setIncomes(updatedTransactions as Transaction[])
      }

      setEditingTransaction(null)
      toast.success("Transacción actualizada exitosamente")
    }
  }

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // Si el usuario está autenticado, no mostramos la pantalla de carga
        setShowLoading(false)
      } else if (isInitialLoad) {
        // Solo mostramos la pantalla de carga en la carga inicial
        const timer = setTimeout(() => {
          setShowLoading(false)
          setIsInitialLoad(false)
        }, 1000) // Mostramos la pantalla de carga por 3 segundos
        return () => clearTimeout(timer)
      } else {
        // Si no es la carga inicial, no mostramos la pantalla de carga
        setShowLoading(false)
      }
    }
  }, [isLoaded, isSignedIn, isInitialLoad])

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard')
    }
  }, [isSignedIn, router])

  const handleLoadingComplete = () => {
    setShowInitialLoading(false)
  }

  if (showInitialLoading) {
    return <InitialLoadingScreen onLoadingComplete={handleLoadingComplete} />
  }

  if (!isLoaded || showLoading) {
    return <InitialLoadingScreen onLoadingComplete={() => setShowLoading(false)} />
  }
  

  if (!isMounted) {
    return null // Evita el renderizado en el servidor
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background animation */}
      {Array.from({ length: 100 }).map((_, index) => (
        <motion.div
          key={index}
          className="fixed w-4 h-4 bg-purple-600 rounded-full opacity-10"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `flameAnimation ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`,
          }}
        />
      ))}

        {/* Header */}
        <motion.header 
        className={`fixed top-0 left-0 right-0 py-4 px-4 sm:px-6 lg:px-8 transition-all duration-300 z-50 ${isScrolled ? 'bg-black bg-opacity-50 backdrop-blur-md' : ''}`}
        animate={{ y: isScrolled ? -10 : 0 }}
      >
        <nav className={`flex flex-col sm:flex-row ${isScrolled ? 'justify-center' : 'justify-between'} items-center max-w-7xl mx-auto`}>
          {!isScrolled && (
            <motion.h1 
              className="text-3xl font-bold mb-4 sm:mb-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: isScrolled ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-purple-600">Lux</span>Finance
            </motion.h1>
          )}
          <motion.div 
            className={`flex gap-6 items-center ${isScrolled ? 'bg-gray-800 bg-opacity-50 rounded-full px-6 py-2' : ''}`}
            animate={{ scale: isScrolled ? 0.9 : 1 }}
          >
            <button onClick={() => scrollTo('resumen')} className="hover:text-purple-600 transition-colors">Resumen</button>
            <button onClick={() => scrollTo('gastos')} className="hover:text-purple-600 transition-colors">Gráficos</button>
            <button onClick={() => scrollTo('historial')} className="hover:text-purple-600 transition-colors">Historial</button>
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200">
                  Iniciar sesión
                </button>
              </SignInButton>
            )}
          </motion.div>
        </nav>
      </motion.header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        <motion.div
          
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-lg shadow-lg p-8 mb-8 relative overflow-hidden bg-gradient-to-br from-purple-900 via-black to-red-900"
        >
          <div 
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: 0.7,
              background: `radial-gradient(circle at ${hoverPosition.x}px ${hoverPosition.y}px, rgba(120, 18, 270, 0.8), rgba(30, 64, 175, 0.4))`,
              mixBlendMode: 'overlay',
            }}
          />
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-4">
              Bienvenido a <span className="text-purple-500">Lux</span>Finance
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Explora nuestras funciones de prueba y descubre cómo LuxFinance puede ayudarte a gestionar tus finanzas.
            </p>
            <SignInButton mode="modal">
              <motion.button
                className="relative bg-gradient-to-r from-red-900 to-purple-950 text-white font-bold py-3 px-6 rounded-lg text-lg overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="absolute inset-0 w-full h-full transition duration-300 ease-out transform -translate-x-full bg-gradient-to-r from-green-700 to-blue-800 group-hover:translate-x-0"></span>
                <span className="relative">Iniciar sesión para comenzar</span>
              </motion.button>
            </SignInButton>
          </div>
        </motion.div>
        
        <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gradient-to-br from-gray-900 to-purple-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-lg p-8 mb-8"
    >
    <motion.h2 
      className="text-4xl font-bold text-white mb-6 text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      Descubre el Poder de <span className="  text-red-500" >LuxFinance</span>
    </motion.h2>
      <motion.p 
        className="text-lg text-gray-300 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        LuxFinance es tu compañero definitivo para el manejo de finanzas personales. Diseñado para empoderar a individuos y familias, nuestra aplicación te ayuda a tomar el control de tu vida financiera con facilidad y elegancia. Descubre cómo LuxFinance puede transformar tu relación con el dinero y ayudarte a alcanzar tus metas financieras.
      </motion.p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {[
          {
            icon: Wallet,
            title: "Seguimiento Inteligente",
            description: "Monitorea tus gastos e ingresos con precisión. Categoriza automáticamente tus transacciones y obtén una visión clara de tus hábitos financieros.",
          },
          {
            icon: TrendingUp,
            title: "Planificación de Metas",
            description: "Establece metas financieras y observa tu progreso en tiempo real. Desde ahorros para vacaciones hasta fondos de emergencia, te ayudamos a alcanzar tus objetivos.",
          },
          {
            icon: Shield,
            title: "Seguridad Primero",
            description: "Tu información financiera está segura con nosotros. Utilizamos encriptación de grado bancario y nunca compartimos tus datos personales.",
          },
          {
            icon: ChartPie,
            title: "Análisis Detallado",
            description: "Visualiza tus finanzas con gráficos interactivos y reportes detallados. Obtén insights valiosos sobre tus patrones de gasto e inversión.",
          },
          {
            icon: Clock,
            title: "Recordatorios Inteligentes",
            description: "Nunca más te olvides de pagar una factura. Configura recordatorios personalizados para pagos recurrentes y fechas importantes.",
          },
          {
            icon: Zap,
            title: "Consejos Personalizados",
            description: "Recibe consejos financieros adaptados a tu situación única. Nuestro sistema de IA te ofrece recomendaciones para mejorar tu salud financiera.",
          },
        ].map((feature, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-md backdrop-blur-sm border border-purple-500 border-opacity-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
          >
            <feature.icon className="w-12 h-12 text-purple-400 mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-purple-300 mb-2 text-center">{feature.title}</h3>
            <p className="text-gray-400 text-center">{feature.description}</p>
          </motion.div>
        ))}
      </div>
      <motion.div 
        className="text-center bg-gray-800 bg-opacity-50 p-6 rounded-lg backdrop-blur-sm border border-purple-500 border-opacity-30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <h3 className="text-2xl font-semibold text-purple-300 mb-4">¿Por qué elegir LuxFinance?</h3>
        <ul className="text-lg text-gray-300 mb-8 list-none space-y-2">
          {["Interfaz intuitiva y fácil de usar", "Sincronización en tiempo real", "Herramientas de presupuesto flexibles y personalizables", "Actualizaciones regulares con nuevas funcionalidades"].map((item, index) => (
            <li key={index} className="flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400 mr-2" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xl text-gray-300 mb-6">
          Únete a miles de usuarios que ya han transformado su vida financiera con LuxFinance.
        </p>
        <blockquote className="text-lg text-purple-300 italic border-l-4 border-purple-500 pl-4">
          LuxFinance ha cambiado completamente la forma en que manejo mi dinero. Ahora tengo el control total de mis finanzas y estoy en camino de alcanzar mis metas de ahorro.
          <footer className="text-gray-400 mt-2">- María G., usuaria satisfecha</footer>
        </blockquote>
      </motion.div>
    </motion.section>

        {/* Financial Summary */}
        <motion.section 
      id="resumen"
      className="bg-gray-900 backdrop-blur-md rounded-lg shadow-lg p-6 mb-8 transition-all duration-300 ease-in-out"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.02, 
        backgroundColor: 'rgba(44, 16, 74, 0.9)',
      }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-purple-300">Resumen Financiero</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          className="text-center p-4 rounded-lg transition-all duration-300 ease-in-out"
          whileHover={{ 
            scale: 1.05, 
            backgroundColor: 'rgba(506, 29, 149, 0.1)',
          }}
        >
          <p className="text-lg">Ingresos Totales</p>
          <p className="text-4xl font-bold text-green-400">${totalIncome.toFixed(2)}</p>
          <div className="mt-2">
            <select
              value={incomeSummaryTimeFrame}
              onChange={(e) => setIncomeSummaryTimeFrame(e.target.value as 'day' | 'month' | 'all')}
              className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="day">Día</option>
              <option value="month">Mes</option>
              <option value="all">Histórico</option>
            </select>
            {incomeSummaryTimeFrame !== 'all' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full mt-2 p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            )}
          </div>
          {totalIncome === 0 && (
            <p className="mt-2 text-yellow-400">No hay ingresos para el período seleccionado.</p>
          )}
        </motion.div>
        <motion.div 
          className="text-center p-4 rounded-lg transition-all duration-300 ease-in-out"
          whileHover={{ 
            scale: 1.05, 
            backgroundColor: 'rgba(506, 29, 149, 0.1)',
          }}
        >
          <p className="text-lg">Gastos Totales</p>
          <p className="text-4xl font-bold text-red-400">${totalExpenses.toFixed(2)}</p>
          <div className="mt-2">
            <select
              value={expenseSummaryTimeFrame}
              onChange={(e) => setExpenseSummaryTimeFrame(e.target.value as 'day' | 'month' | 'all')}
              className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="day">Día</option>
              <option value="month">Mes</option>
              <option value="all">Histórico</option>
            </select>
            {expenseSummaryTimeFrame !== 'all' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full mt-2 p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            )}
          </div>
          {totalExpenses === 0 && (
            <p className="mt-2 text-yellow-400">No hay gastos para el período seleccionado.</p>
          )}
        </motion.div>
        <motion.div 
          className="text-center p-4 rounded-lg transition-all duration-300 ease-in-out"
          whileHover={{ 
            scale: 1.05, 
            backgroundColor: 'rgba(506, 29, 149, 0.1)',
          }}
        >
          <p className="text-lg">Balance</p>
          <p className={`text-4xl font-bold ${totalBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            ${totalBalance.toFixed(2)}
          </p>
          <div className="mt-2">
            <select
              value={balanceSummaryTimeFrame}
              onChange={(e) => setBalanceSummaryTimeFrame(e.target.value as 'day' | 'month' | 'all')}
              className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="day">Día</option>
              <option value="month">Mes</option>
              <option value="all">Histórico</option>
            </select>
            {balanceSummaryTimeFrame !== 'all' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full mt-2 p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            )}
          </div>
          {totalIncome === 0 && totalExpenses === 0 && (
            <p className="mt-2 text-yellow-400">No hay transacciones para el período seleccionado.</p>
          )}
        </motion.div>
      </div>
      {showBudgetAlerts.length > 0 && (
        <motion.div 
          className="mt-4 p-4 bg-red-900 bg-opacity-50 border border-red-700 text-red-100 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <AlertTriangle className="mr-2" />
            Alertas de Presupuesto
          </h3>
          {showBudgetAlerts.map((alert, index) => (
            <p key={index} className="mb-1">{alert}</p>
          ))}
        </motion.div>
      )}
    </motion.section>

        {/* Expense Limits */}
        <motion.section 
          className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Límites de Gastos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <motion.div 
              className="p-4 bg-blue-900 bg-opacity-50 rounded-lg"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="font-semibold mb-2">Límite Diario</h3>
              <input
                type="number"
                value={budgetLimits.daily}
                onChange={(e) => setBudgetLimits({...budgetLimits, daily: parseFloat(e.target.value)})}
                className="w-full p-2 bg-gray-800 text-white border border-blue-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </motion.div>
            <motion.div 
              className="p-4 bg-green-900 bg-opacity-50 rounded-lg"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="font-semibold mb-2">Límite Mensual</h3>
              <input
                type="number"
                value={budgetLimits.monthly}
                onChange={(e) => setBudgetLimits({...budgetLimits, monthly: parseFloat(e.target.value)})}
                className="w-full p-2 bg-gray-800 text-white border border-green-700 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
            </motion.div>
          </div>
          <motion.div
            className="mt-4"
            initial={false}
            animate={{ height: showBudgetOptions ? 'auto' : 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setShowBudgetOptions(!showBudgetOptions)}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center"
            >
              {showBudgetOptions ? 'Ocultar opciones de límite personalizado' : 'Mostrar opciones de límite personalizado'}
              <ChevronDown className={`ml-2 transform transition-transform duration-200 ${showBudgetOptions ? 'rotate-180' : ''}`} />
            </button>
            {showBudgetOptions && (
              <div className="mt-4 p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                <h3 className="font-semibold mb-2">Límite Personalizado</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="number"
                    value={budgetLimits.custom.amount}
                    onChange={(e) => setBudgetLimits({...budgetLimits, custom: {...budgetLimits.custom, amount: parseFloat(e.target.value)}})}
                    className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                    placeholder="Monto"
                  />
                  <div>
                    <label htmlFor="customStartDate" className="block text-sm font-medium text-gray-400 mb-1">Fecha inicial</label>
                    <input
                      id="customStartDate"
                      type="date"
                      value={budgetLimits.custom.startDate}
                      onChange={(e) => setBudgetLimits({...budgetLimits, custom: {...budgetLimits.custom, startDate: e.target.value}})}
                      className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="customEndDate" className="block text-sm font-medium text-gray-400 mb-1">Fecha final</label>
                    <input
                      id="customEndDate"
                      type="date"
                      value={budgetLimits.custom.endDate}
                      onChange={(e) => setBudgetLimits({...budgetLimits, custom: {...budgetLimits.custom, endDate: e.target.value}})}
                      className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                    />
                  </div>
                </div>
                <button
                  onClick={addCustomBudgetLimit}
                  className="mt-4 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Agregar Límite Personalizado
                </button>
              </div>
            )}
          </motion.div>
          {customBudgetLimits.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Límites Personalizados Activos</h3>
              {customBudgetLimits.map((limit, index) => (
                <div key={index} className="mb-2 p-2 bg-gray-800 bg-opacity-50 rounded">
                  <p>Monto: ${limit.amount} | Periodo: {limit.startDate} - {limit.endDate}</p>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Expense and Income Charts */}
        <div id="gastos" className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-purple-300">Distribución de Gastos</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveExpenseChart(activeExpenseChart === 'pie' ? 'bar' : 'pie')}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  {activeExpenseChart === 'pie' ? <BarChart2 className="w-5 h-5" /> : <PieChartIcon className="w-5 h-5" />}
                </button>
                <select
                  value={expenseTimeFrame}
                  onChange={(e) => setExpenseTimeFrame(e.target.value as 'day' | 'month' | 'all')}
                  className="p-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="day">Día</option>
                  <option value="month">Mes</option>
                  <option value="all">Histórico</option>
                </select>
                {expenseTimeFrame !== 'all' && (
                  <input
                    type="date"
                    value={expenseChartDate}
                    onChange={(e) => setExpenseChartDate(e.target.value)}
                    className="p-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                )}
              </div>
            </div>
            {Object.keys(expensesByCategory).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {activeExpenseChart === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={Object.entries(expensesByCategory).map(([category, data]) => ({
                        name: category,
                        value: data.amount
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(expensesByCategory).map(([category, data], index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          className="transition-all duration-300 hover:opacity-80 hover:cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`$${value} (${expensesByCategory[name].percentage}%)`, name]}
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                ) : (
                  <BarChart data={Object.entries(expensesByCategory).map(([category, data]) => ({
                    name: category,
                    amount: data.amount
                  }))}>
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number, name: string, props: any) => [`$${value} (${expensesByCategory[props.payload.name].percentage}%)`, props.payload.name]}
                    />
                    <Bar dataKey="amount" fill="#8884d8">
                      {Object.entries(expensesByCategory).map(([category, data], index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          className="transition-all duration-300 hover:opacity-80 hover:cursor-pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No hay gastos para el período seleccionado
              </div>
            )}
          </motion.div>

          <motion.div 
            className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Gastos por Categoría</h2>
            <div className="space-y-4 pr-2">
              {Object.entries(expensesByCategory).map(([category, data], index) => (
                <motion.div 
                  key={index} 
                  className="flex justify-between items-center p-2 bg-gray-800 bg-opacity-50 rounded-lg"
                  whileHover={{ scale: 1.02, backgroundColor: "#374151" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <span>{category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400">${data.amount.toFixed(2)} ({data.percentage}%)</span>
                    <span className="text-gray-400 text-sm">({data.count} gastos)</span>
                    <motion.button 
                      onClick={() => addExpenseToCategory(category)}
                      className="text-blue-400 hover:text-blue-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus size={16} />
                    </motion.button>
                    <motion.button 
                      onClick={() => setEditingExpenseCategory(category)}
                      className="text-green-400 hover:text-green-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit2 size={16} />
                    </motion.button>
                    <motion.button 
                      onClick={() => deleteCategory(category, 'expense')}
                      className="text-red-400 hover:text-red-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Income Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <motion.div 
            className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-purple-300">Distribución de Ingresos</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveIncomeChart(activeIncomeChart === 'pie' ? 'bar' : 'pie')}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  {activeIncomeChart === 'pie' ? <BarChart2 className="w-5 h-5" /> : <PieChartIcon className="w-5 h-5" />}
                </button>
                <select
                  value={incomeTimeFrame}
                  onChange={(e) => setIncomeTimeFrame(e.target.value as 'day' | 'month' | 'all')}
                  className="p-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="day">Día</option>
                  <option value="month">Mes</option>
                  <option value="all">Histórico</option>
                </select>
                {incomeTimeFrame !== 'all' && (
                  <input
                    type="date"
                    value={incomeChartDate}
                    onChange={(e) => setIncomeChartDate(e.target.value)}
                    className="p-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                )}
              </div>
            </div>
            {Object.keys(incomesByCategory).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {activeIncomeChart === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={Object.entries(incomesByCategory).map(([category, data]) => ({
                        name: category,
                        value: data.amount
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(incomesByCategory).map(([category, data], index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          className="transition-all duration-300 hover:opacity-80 hover:cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`$${value} (${incomesByCategory[name].percentage}%)`, name]}
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                ) : (
                  <BarChart data={Object.entries(incomesByCategory).map(([category, data]) => ({
                    name: category,
                    amount: data.amount
                  }))}>
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number, name: string, props: any) => [`$${value} (${incomesByCategory[props.payload.name].percentage}%)`, props.payload.name]}
                    />
                    <Bar dataKey="amount" fill="#4BC0C0">
                      {Object.entries(incomesByCategory).map(([category, data], index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          className="transition-all duration-300 hover:opacity-80 hover:cursor-pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No hay ingresos para el período seleccionado
              </div>
            )}
          </motion.div>

          <motion.div 
            className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Ingresos por Categoría</h2>
            <div className="space-y-4 pr-2">
              {Object.entries(incomesByCategory).map(([category, data], index) => (
                <motion.div 
                  key={index} 
                  className="flex justify-between items-center p-2 bg-gray-800 bg-opacity-50 rounded-lg"
                  whileHover={{ scale: 1.02, backgroundColor: "#374151" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <span>{category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">${data.amount.toFixed(2)} ({data.percentage}%)</span>
                    <span className="text-gray-400 text-sm">({data.count} ingresos)</span>
                    <motion.button 
                      onClick={() => addIncomeToCategory(category)}
                      className="text-blue-400 hover:text-blue-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus size={16} />
                    </motion.button>
                    <motion.button 
                      onClick={() => setEditingIncomeCategory(category)}
                      className="text-green-400 hover:text-green-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit2 size={16} />
                    </motion.button>
                    <motion.button 
                      onClick={() => deleteCategory(category, 'income')}
                      className="text-red-400 hover:text-red-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Expense Chart */}
        <motion.section 
          className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6 mt-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Gastos {expenseTimeFrame === 'day' ? 'Diarios' : expenseTimeFrame === 'month' ? 'Mensuales' : 'Históricos'}</h2>
          <div className="mb-4 flex space-x-2">
            <motion.button 
              onClick={() => setExpenseTimeFrame('day')} 
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${expenseTimeFrame === 'day' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Día
            </motion.button>
            <motion.button 
              onClick={() => setExpenseTimeFrame('month')} 
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${expenseTimeFrame === 'month' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Mes
            </motion.button>
            <motion.button 
              onClick={() => setExpenseTimeFrame('all')} 
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${expenseTimeFrame === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Histórico
            </motion.button>
          </div>
          {expenseTimeFrame !== 'all' && (
            <input
              type="date"
              value={expenseChartDate}
              onChange={(e) => setExpenseChartDate(e.target.value)}
              className="w-full mb-4 p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          )}
          {expenseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={expenseChartData}>
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                          <p className="text-white font-bold">{label}</p>
                          <p className="text-green-400">Monto: ${payload[0].value}</p>
                          <div className="mt-2">
                            <p className="text-white font-semibold">Detalles:</p>
                            <ul className="list-disc list-inside">
                              {payload[0].payload.details.map((detail: string, index: number) => (
                                <li key={index} className="text-gray-300 text-sm">{detail}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No hay gastos para el período seleccionado
            </div>
          )}
        </motion.section>

        {/* Income Chart */}
        <motion.section 
          className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6 mt-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Ingresos {incomeTimeFrame === 'day' ? 'Diarios' : incomeTimeFrame === 'month' ? 'Mensuales' : 'Históricos'}</h2>
          <div className="mb-4 flex space-x-2">
            <motion.button 
              onClick={() => setIncomeTimeFrame('day')} 
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${incomeTimeFrame === 'day' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Día
            </motion.button>
            <motion.button 
              onClick={() => setIncomeTimeFrame('month')} 
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${incomeTimeFrame === 'month' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Mes
            </motion.button>
            <motion.button 
              onClick={() => setIncomeTimeFrame('all')} 
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${incomeTimeFrame === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Histórico
            </motion.button>
          </div>
          {incomeTimeFrame !== 'all' && (
            <input
              type="date"
              value={incomeChartDate}
              onChange={(e) => setIncomeChartDate(e.target.value)}
              className="w-full mb-4 p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          )}
          {incomeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={incomeChartData}>
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                          <p className="text-white font-bold">{label}</p>
                          <p className="text-green-400">Monto: ${payload[0].value}</p>
                          <div className="mt-2">
                            <p className="text-white font-semibold">Detalles:</p>
                            <ul className="list-disc list-inside">
                              {payload[0].payload.details.map((detail: string, index: number) => (
                                <li key={index} className="text-gray-300 text-sm">{detail}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="amount" stroke="#4BC0C0" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No hay ingresos para el período seleccionado
            </div>
          )}
        </motion.section>

        {/* Income Goals */}
        <motion.section 
          className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6 mt-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Metas de Ingresos</h2>
          <div className="space-y-4">
            {incomeGoals.map((goal) => {
              const progress = getIncomeGoalProgress(goal)
              return (
                <motion.div 
                  key={goal.id} 
                  className="flex justify-between items-center p-3 bg-gray-800 bg-opacity-50 rounded-lg"
                  whileHover={{ scale: 1.02, backgroundColor: "#374151" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div>
                    <span className="font-semibold">${goal.amount}</span>
                    <p className="text-sm text-gray-400">{goal.date} - {goal.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 relative">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#444"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#4BC0C0"
                          strokeWidth="3"
                          strokeDasharray={`${progress}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold">{progress.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      {progress === 100 && <p className="text-green-400">¡Meta completada!</p>}
                      {progress > 50 && progress < 100 && <p className="text-yellow-400">¡Ya superaste la mitad de tu meta!</p>}
                    </div>
                    <div className="flex space-x-2">
                      <motion.button 
                        onClick={() => setEditingIncomeGoal(goal)}
                        className="text-blue-400 hover:text-blue-300 flex items-center"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit2 size={16} className="mr-1" />
                        <span>Editar meta o agregar dinero</span>
                      </motion.button>
                      <motion.button 
                        onClick={() => setIncomeGoals(incomeGoals.filter(g => g.id !== goal.id))}
                        className="text-red-400 hover:text-red-300"
                        whileHover={{ scale: 1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          <motion.button
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddIncomeGoal(true)}
          >
            Agregar Meta de Ingreso
          </motion.button>
        </motion.section>
        
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6 mb-8 mt-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-purple-300">Recordatorios Inteligentes</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full flex items-center"
              onClick={() => setIsAddingReminder(true)}
            >
              <Plus size={20} className="mr-2" />
              Añadir Recordatorio
            </motion.button>
          </div>

          <AnimatePresence>
            {isAddingReminder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-800 p-4 rounded-lg mb-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Nuevo Recordatorio</h3>
                  <button onClick={() => setIsAddingReminder(false)} className="text-gray-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Título"
                  value={reminderDraft.title}
                  onChange={(e) => setReminderDraft({ ...reminderDraft, title: e.target.value })}
                  className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                />
                <input
                  type="date"
                  value={reminderDraft.date}
                  onChange={(e) => setReminderDraft({ ...reminderDraft, date: e.target.value })}
                  className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={reminderDraft.description}
                  onChange={(e) => setReminderDraft({ ...reminderDraft, description: e.target.value })}
                  className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                  rows={3}
                />
                <button
                  onClick={HandlerAddReminder}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  Guardar Recordatorio
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((reminder) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gray-800 p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Bell size={24} className="text-purple-400 mr-4" />
                      <div>
                        <h3 className="text-lg font-semibold">{reminder.title}</h3>
                        <p className="text-gray-400">{format(parseISO(reminder.date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingReminder(reminder)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => HandlerDeleteReminder(reminder.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  {reminder.description && (
                    <p className="text-sm text-gray-500 mt-1 mb-2">{reminder.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <Clock size={16} className="text-yellow-400 mr-2" />
                      <p className="text-sm text-yellow-400">
                        {differenceInDays(parseISO(reminder.date), new Date()) <= 0
                          ? "¡Hoy es el día!"
                          : `Faltan ${differenceInDays(parseISO(reminder.date), new Date())} días`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsAddingNote(true)
                        setEditingReminder(reminder)
                      }}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {reminder.notes.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-semibold text-gray-400 mb-1">Notas:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-500">
                        {reminder.notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <p className="text-gray-400 text-center">No hay recordatorios próximos.</p>
            )}
          </div>
        </motion.section>

        {/* Custom Date Range Calculation */}
        <motion.section 
          className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6 mt-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Cálculo por Rango de Fechas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-1">Fecha inicial</label>
              <input
                id="startDate"
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-400 mb-1">Fecha final</label>
              <input
                id="endDate"
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  const expenseTotal = calculateCustomRangeTotal('expense')
                  const incomeTotal = calculateCustomRangeTotal('income')
                  setCalculationResult({ expenses: expenseTotal, incomes: incomeTotal })
                  setShowCalculationResult(true)
                }}
                className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                Calcular
              </button>
            </div>
          </div>
        </motion.section>

        {/* Transaction History */}
        <motion.section 
          id="historial"
          className="bg-gray-900 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg p-6 mt-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Historial de Transacciones</h2>
          <div className="mb-4 flex space-x-2">
            <div className="relative flex-grow">
              <button
                onClick={() => setShowSearchMenu(!showSearchMenu)}
                className="w-full p-2 pl-8 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent flex items-center justify-between"
              >
                <span>{selectedCategory || 'Seleccionar categoría'}</span>
                <ChevronDown className={`transform transition-transform duration-200 ${showSearchMenu ? 'rotate-180' : ''}`} />
              </button>
              <Search className="absolute left-2 top-2 text-gray-400" size={20} />
              {showSearchMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
                >
                  <div className="p-2 flex justify-between">
                    <h3 className="text-sm font-semibold text-gray-400">Categorías</h3>
                    <button
                      onClick={() => {
                        setSelectedCategory(null)
                        setShowSearchMenu(false)
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="border-t border-gray-700"></div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Gastos</h4>
                        {getFilteredCategories().expenseCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedCategory(category)
                              setShowSearchMenu(false)
                            }}
                            className="w-full text-left p-2 hover:bg-gray-700 rounded"
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Ingresos</h4>
                        {getFilteredCategories().incomeCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedCategory(category)
                              setShowSearchMenu(false)
                            }}
                            className="w-full text-left p-2 hover:bg-gray-700 rounded"
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <select
              value={transactionTimeFrame}
              onChange={(e) => setTransactionTimeFrame(e.target.value as 'day' | 'month' | 'all')}
              className="p-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="day">Día</option>
              <option value="month">Mes</option>
              <option value="all">Histórico</option>
            </select>
            {transactionTimeFrame !== 'all' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            )}
          </div>
          <div className="space-y-4 max-h-full  pr-2">
          {filteredTransactions.length > 0 ? (
        filteredTransactions.map((transaction) => (
          <motion.div 
            key={transaction.id} 
            className="flex justify-between items-center p-3 bg-gray-800 bg-opacity-50 rounded-lg"
            whileHover={{ scale: 1.02, backgroundColor: "#374151" }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div>
              <span className="font-semibold">{transaction.category}</span>
              <p className="text-sm text-gray-400">{format(parseISO(transaction.date), 'dd/MM/yyyy HH:mm')}</p>
              <p className="text-sm text-gray-400">{transaction.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                ${Math.abs(transaction.amount).toFixed(2)}
              </span>
              <motion.button 
                onClick={() => handleEditTransaction(transaction)}
                className="text-blue-400 hover:text-blue-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Edit2 size={16} />
              </motion.button>
              <motion.button 
                onClick={() => handleDeleteTransaction(transaction.id, transaction.type)}
                className="text-red-400 hover:text-red-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 size={16} />
              </motion.button>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="text-center text-gray-400">
          No se encontraron transacciones para los criterios seleccionados.
        </div>
      )}
    </div>
  </motion.section>

        {/* Modals */}
        <AnimatePresence>
          {showAddExpense && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Agregar Gasto</h3>
                <input
                  type="text"
                  placeholder="Categoría"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Monto"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newExpense.amount || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                />
                <input
                  type="datetime-local"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Descripción"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setShowAddExpense(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    onClick={() => {
                      addExpense()
                      setShowAddExpense(false)
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showAddIncome && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Agregar Ingreso</h3>
                <input
                  type="text"
                  placeholder="Categoría"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newIncome.category}
                  onChange={(e) => setNewIncome({ ...newIncome, category: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Monto"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newIncome.amount || ''}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) })}
                />
                <input
                  type="datetime-local"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newIncome.date}
                  onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Descripción"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newIncome.description}
                  onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setShowAddIncome(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    onClick={() => {
                      addIncome()
                      setShowAddIncome(false)
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

            {editingExpenseCategory && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
                <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl"
                >
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Editar Gastos de {editingExpenseCategory}</h3>
                <div className="max-h-96 overflow-y-auto pr-2">
                    {expenses.filter(e => e.category === editingExpenseCategory).map((expense) => (
                    <motion.div 
                        key={expense.id} 
                        className="mb-4 p-4 bg-gray-700 rounded-lg"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">
                            {format(parseISO(expense.date), 'dd/MM/yyyy HH:mm')}
                        </span>
                        <span className="text-red-400">${expense.amount.toFixed(2)}</span>
                        </div>
                        <input
                        type="number"
                        className="w-full p-2 mb-2 bg-gray-600 text-white border border-gray-500 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                        value={expense.amount}
                        onChange={(e) => {
                            const updatedExpenses = [...expenses]
                            updatedExpenses[expenses.findIndex(exp => exp.id === expense.id)].amount = parseFloat(e.target.value)
                            setExpenses(updatedExpenses)
                        }}
                        />
                        <input
                        type="text"
                        className="w-full p-2 mb-2 bg-gray-600 text-white border border-gray-500 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                        value={expense.description}
                        onChange={(e) => {
                            const updatedExpenses = [...expenses]
                            updatedExpenses[expenses.findIndex(exp => exp.id === expense.id)].description = e.target.value
                            setExpenses(updatedExpenses)
                        }}
                        />
                        <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="mt-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
                        >
                        <Trash2 size={16} className="mr-2" />
                        Eliminar
                        </button>
                    </motion.div>
                    ))}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setEditingExpenseCategory(null)}
                    >
                    Cancelar
                    </button>
                    <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    onClick={() => saveEditedExpenses(expenses.filter(e => e.category === editingExpenseCategory))}
                    >
                    Guardar
                    </button>
                </div>
                </motion.div>
            </motion.div>
            )}

            {editingIncomeCategory && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
                <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl"
                >
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Editar Ingresos de {editingIncomeCategory}</h3>
                <div className="max-h-96 overflow-y-auto pr-2">
                    {incomes.filter(i => i.category === editingIncomeCategory).map((income) => (
                    <motion.div 
                        key={income.id} 
                        className="mb-4 p-4 bg-gray-700 rounded-lg"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">
                            {format(parseISO(income.date), 'dd/MM/yyyy HH:mm')}
                        </span>
                        <span className="text-green-400">${income.amount.toFixed(2)}</span>
                        </div>
                        <input
                        type="number"
                        className="w-full p-2 mb-2 bg-gray-600 text-white border border-gray-500 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                        value={income.amount}
                        onChange={(e) => {
                            const updatedIncomes = [...incomes]
                            updatedIncomes[incomes.findIndex(inc => inc.id === income.id)].amount = parseFloat(e.target.value)
                            setIncomes(updatedIncomes)
                        }}
                        />
                        <input
                        type="text"
                        className="w-full p-2 mb-2 bg-gray-600 text-white border border-gray-500 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                        value={income.description}
                        onChange={(e) => {
                            const updatedIncomes = [...incomes]
                            updatedIncomes[incomes.findIndex(inc => inc.id === income.id)].description = e.target.value
                            setIncomes(updatedIncomes)
                        }}
                        />
                        <button
                        onClick={() => handleDeleteIncome(income.id)}
                        className="mt-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
                        >
                        <Trash2 size={16} className="mr-2" />
                        Eliminar
                        </button>
                    </motion.div>
                    ))}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setEditingIncomeCategory(null)}
                    >
                    Cancelar
                    </button>
                    <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    onClick={() => saveEditedIncomes(incomes.filter(i => i.category === editingIncomeCategory))}
                    >
                    Guardar
                    </button>
                </div>
                </motion.div>
            </motion.div>
            )}

          {showAddIncomeGoal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Agregar Meta de Ingreso</h3>
                <input
                  type="number"
                  placeholder="Monto"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newIncomeGoal.amount || ''}
                  onChange={(e) => setNewIncomeGoal({ ...newIncomeGoal, amount: parseFloat(e.target.value) })}
                />
                <input
                  type="date"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newIncomeGoal.date}
                  onChange={(e) => setNewIncomeGoal({ ...newIncomeGoal, date: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Descripción"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newIncomeGoal.description}
                  onChange={(e) => setNewIncomeGoal({ ...newIncomeGoal, description: e.target.value })}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setShowAddIncomeGoal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    onClick={handleaddIncomeGoal}
                  >
                    Agregar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showCalculationResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Resultado del Cálculo</h3>
                <p className="mb-2">Período: {customDateRange.startDate} - {customDateRange.endDate}</p>
                <p className="mb-2">Total de Gastos: ${calculationResult.expenses.toFixed(2)}</p>
                <p className="mb-2">Total de Ingresos: ${calculationResult.incomes.toFixed(2)}</p>
                <p className="mb-4 font-semibold">Balance: ${(calculationResult.incomes - calculationResult.expenses).toFixed(2)}</p>
                <button
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                  onClick={() => setShowCalculationResult(false)}
                >
                  Cerrar
                </button>
              </motion.div>
            </motion.div>
          )}

          {editingIncomeGoal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Editar Meta de Ingreso</h3>
                <input
                  type="number"
                  placeholder="Monto"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={editingIncomeGoal.amount}
                  onChange={(e) => setEditingIncomeGoal({ ...editingIncomeGoal, amount: parseFloat(e.target.value) })}
                />
                <input
                  type="date"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={editingIncomeGoal.date}
                  onChange={(e) => setEditingIncomeGoal({ ...editingIncomeGoal, date: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Descripción"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={editingIncomeGoal.description}
                  onChange={(e) => setEditingIncomeGoal({ ...editingIncomeGoal, description: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Monto actual"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={editingIncomeGoal.currentAmount}
                  onChange={(e) => setEditingIncomeGoal({ ...editingIncomeGoal, currentAmount: parseFloat(e.target.value) })}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setEditingIncomeGoal(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    onClick={() => handleUpdateIncomeGoal(editingIncomeGoal)}
                  >
                    Guardar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showAddNote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Agregar Nota</h3>
                <textarea
                  placeholder="Escribe tu nota aquí"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setShowAddNote(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    onClick={() => {
                      if (editingIncomeGoal) {
                        addNoteToIncomeGoal(editingIncomeGoal.id, newNote)
                        setEditingIncomeGoal(null)
                      }
                      setShowAddNote(false)
                    }}
                  >
                    Agregar Nota
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {editingReminder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Editar Recordatorio</h3>
                <input
                  type="text"
                  placeholder="Título"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={editingReminder.title}
                  onChange={(e) => setEditingReminder({ ...editingReminder, title: e.target.value })}
                />
                <input
                  type="date"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={editingReminder.date}
                  onChange={(e) => setEditingReminder({ ...editingReminder, date: e.target.value })}
                />
                <textarea
                  placeholder="Descripción"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={editingReminder.description}
                  onChange={(e) => setEditingReminder({ ...editingReminder, description: e.target.value })}
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setEditingReminder(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    onClick={() => updateReminderHandler(editingReminder)}
                  >
                    Guardar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isAddingNote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Agregar Nota al Recordatorio</h3>
                <textarea
                  placeholder="Escribe tu nota aquí"
                  className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => {
                      setIsAddingNote(false)
                      setNoteDraft('')
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    onClick={() => {
                      if (editingReminder) {
                        addNoteToReminder(editingReminder.id, noteDraft)
                        setEditingReminder(null)
                      }
                      setIsAddingNote(false)
                      setNoteDraft('')
                    }}
                  >
                    Agregar Nota
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

{editingTransaction && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
      >
        <h3 className="text-xl font-semibold mb-4 text-purple-300">
          Editar {editingTransaction.type === 'expense' ? 'Gasto' : 'Ingreso'}
        </h3>
        <input
          type="text"
          placeholder="Categoría"
          className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
          value={editingTransaction.category}
          onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
        />
        <input
          type="number"
          placeholder="Monto"
          className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
          value={editingTransaction.amount}
          onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) })}
        />
        <input
          type="datetime-local"
          className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
          value={editingTransaction.date}
          onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
        />
        <input
          type="text"
          placeholder="Descripción"
          className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg hover:border-purple-500 focus:border-purple-500 transition-colors duration-200"
          value={editingTransaction.description}
          onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
        />
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            onClick={() => setEditingTransaction(null)}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            onClick={handleUpdateTransaction}
          >
            Guardar
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
        </AnimatePresence>
      </main>

{/* Floating Action Buttons */}
<div className="fixed bottom-8 right-8 flex flex-col space-y-4 z-50">
        <motion.button
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddExpense(true)}
          aria-label="Agregar gasto"
        >
          <Plus size={24} />
        </motion.button>
        <motion.button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddIncome(true)}
          aria-label="Agregar ingreso"
        >
          <DollarSign size={24} />
        </motion.button>
        <motion.button
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddIncomeGoal(true)}
          aria-label="Establecer meta"
        >
          <Target size={24} />
        </motion.button>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg z-50"
            onClick={scrollToTop}
            aria-label="Volver arriba"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Background Animation Styles */}
      <style jsx global>{`
        @keyframes flameAnimation {
          0% { transform: translateY(0) scale(1); opacity: 0.1; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.2; }
          100% { transform: translateY(-40px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}