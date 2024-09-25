import React from 'react'
import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-purple-400">Lux</span>Finance
        </h1>
        <p className="text-xl text-gray-300">Preparando tu experiencia financiera</p>
      </motion.div>

      <div className="relative">
        <motion.div
          initial={{ scale: 1 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-t-4 border-purple-500 border-solid rounded-full"
        ></motion.div>
        <motion.div
          initial={{ scale: 1 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-t-4 border-purple-300 border-solid rounded-full absolute top-4 left-4"
        ></motion.div>
      </div>

      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        className="mt-8"
      >
        <p className="text-lg text-gray-300">Cargando tus datos...</p>
      </motion.div>

      {/* Elementos decorativos animados */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </div>
  )
}