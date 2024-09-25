'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface InitialLoadingScreenProps {
  onLoadingComplete: () => void;
}

const InitialLoadingScreen: React.FC<InitialLoadingScreenProps> = ({ onLoadingComplete }) => {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev < 100) {
          return prev + 1
        } else {
          clearInterval(interval)
          setShowButton(true)
          return 100
        }
      })
    }, 30)
    return () => {
      document.body.style.overflow = 'unset'
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0"
        initial={{
          background: 'linear-gradient(to right, #2a0a2e, #61023e, #ab1b3f, #d65c31, #dfb42e)'
        }}
        animate={{
          background: [
            'linear-gradient(to right, #2a0a2e, #61023e, #ab1b3f, #d65c31, #dfb42e)',
            'linear-gradient(to right, #0a0521, #2b0f4f, #542f7c, #9561a3, #d5a6)',
            'linear-gradient(to right, #002e5c, #005596, #0088c8, #28aec4, #70c0cf)',
            'linear-gradient(to right, #002b13, #004000, #005200, #006000, #188000)',
            'linear-gradient(to right, #2a0a2e, #61023e, #ab1b3f, #d65c31, #dfb42e)',
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      {/* Central loading animation */}
      <div className="relative w-64 h-64 -mt-32">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-500 to-red-500 rounded-full"
          initial={{ rotate: 0 }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute inset-2 bg-black rounded-full flex items-center justify-center"
          initial={{ scale: 1 }}
          animate={{ scale: 1 }}
        >
          <motion.h1
            className="text-4xl font-bold"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-purple-400">Lux</span>
            <span className="text-red-400">Finance</span>
          </motion.h1>
        </motion.div>
      </div>

      {/* Loading progress bar */}
      <motion.div
        className="absolute bottom-10 left-10 right-10 h-2 bg-gray-800 rounded-full overflow-hidden"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-red-500"
          initial={{ width: "0%" }}
          animate={{ width: `${loadingProgress}%` }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>

      {/* Loading text */}
      <AnimatePresence>
        {loadingProgress < 100 && (
          <motion.p
            className="absolute bottom-20 text-white text-xl font-light"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            key={Math.floor(loadingProgress / 10)}
          >
            {loadingProgress < 30 && "Iniciando sistemas..."}
            {loadingProgress >= 30 && loadingProgress < 60 && "Cargando datos financieros..."}
            {loadingProgress >= 60 && loadingProgress < 90 && "Preparando tu experiencia personalizada..."}
            {loadingProgress >= 90 && loadingProgress < 100 && "¡Casi listo!"}
          </motion.p>
        )}
      </AnimatePresence>

      {/* "Gestiona tu dinero" button */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            className="absolute bottom-20 px-6 py-3 bg-gradient-to-r from-purple-500 to-red-500 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={onLoadingComplete}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Gestiona tu dinero
          </motion.button>
        )}
      </AnimatePresence>

      {/* Pulsating circles */}
      {[...Array(3)].map((_, index) => (
        <motion.div
          key={`pulse-${index}`}
          className="absolute rounded-full border-2 border-white"
          style={{
            width: 200 + index * 50,
            height: 200 + index * 50,
            top: '50%',
            left: '50%',
            marginTop: `-${(200 + index * 50) / 2 + 64}px`,
            marginLeft: `-${(200 + index * 50) / 2}px`,
          }}
          initial={{
            scale: 1,
            opacity: 0.1
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: index * 0.5,
          }}
        />
      ))}
    </div>
  )
}

export default InitialLoadingScreen