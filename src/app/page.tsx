'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets, Dumbbell, Target, Check, Plus, Minus,
  LogOut, Users, User, Lock, Eye, EyeOff, ChevronRight,
  Edit3, X, Home as HomeIcon, Settings, Palette, ChevronLeft, Bell,
  Clock, Trash2, Calendar, BarChart3, Camera, Image, Upload, Save,
  UserPlus, UserMinus
} from 'lucide-react'
import { Member, Goal, DashboardMember, FamilySettings } from '@/types'
import { AVATAR_COLORS, GRADIENT_THEMES, WATER_UNITS, convertMlToUnit, convertWaterToMl } from '@/lib/utils'

// API Helper
const api = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    }
  },

  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    const res = await fetch(`/api${endpoint}`, { ...options, headers })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Request failed')
    }
    return res.json()
  },

  post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetch(endpoint, { method: 'POST', body: JSON.stringify(data) })
  },

  put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetch(endpoint, { method: 'PUT', body: JSON.stringify(data) })
  },

  delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.fetch(endpoint, { method: 'DELETE', body: data ? JSON.stringify(data) : undefined })
  }
}

// Auth Context
interface AuthContextType {
  family: { id: string; name: string } | null
  members: Member[]
  currentMember: Member | null
  settings: FamilySettings | null
  refreshSettings: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)
const useAuth = () => useContext(AuthContext)

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

// Components
function WaterGlass({ percentage }: { percentage: number }) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage))
  return (
    <div className="relative w-24 h-28 mx-auto">
      <svg viewBox="0 0 100 120" className="w-full h-full">
        <path
          d="M15 10 L85 10 L80 110 Q50 120 20 110 Z"
          fill="rgba(255,255,255,0.1)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        />
        <clipPath id="glassClip">
          <path d="M17 12 L83 12 L78 108 Q50 116 22 108 Z" />
        </clipPath>
        <rect
          x="0"
          y={120 - (clampedPercentage * 1.08)}
          width="100"
          height={clampedPercentage * 1.08}
          fill="url(#waterGradient)"
          clipPath="url(#glassClip)"
          className="water-fill"
        />
        <defs>
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-lg">{Math.round(clampedPercentage)}%</span>
      </div>
    </div>
  )
}

function ProgressRing({ progress, size = 100, strokeWidth = 8, color = '#8b5cf6' }: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(100, progress) / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring-circle"
      />
    </svg>
  )
}

// Login Screen
function LoginScreen({ onLogin }: { onLogin: (family: { id: string; name: string }, members: Member[]) => void }) {
  const [isRegister, setIsRegister] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [members, setMembers] = useState([
    { name: '', pin: '', avatarColor: AVATAR_COLORS[5] },
    { name: '', pin: '', avatarColor: AVATAR_COLORS[11] }
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        if (members.some(m => !m.name || m.pin.length !== 4)) {
          throw new Error('All family members need a name and 4-digit PIN')
        }
        const result = await api.post<{ token: string; family: { id: string; name: string }; members: Member[] }>(
          '/auth/register',
          { familyName, password, members }
        )
        api.setToken(result.token)
        onLogin(result.family, result.members)
      } else {
        const result = await api.post<{ token: string; family: { id: string; name: string }; members: Member[] }>(
          '/auth/login',
          { familyName, password }
        )
        api.setToken(result.token)
        onLogin(result.family, result.members)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const addMember = () => {
    if (members.length < 10) {
      setMembers([...members, { name: '', pin: '', avatarColor: AVATAR_COLORS[members.length % AVATAR_COLORS.length] }])
    }
  }

  const removeMember = (index: number) => {
    if (members.length > 2) {
      setMembers(members.filter((_, i) => i !== index))
    }
  }

  const updateMember = (index: number, field: string, value: string) => {
    const updated = [...members]
    updated[index] = { ...updated[index], [field]: value }
    setMembers(updated)
  }

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="glass rounded-3xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Family Goals</h1>
          <p className="text-white/60 mt-2">Track goals together</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Family Name</label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="input-field"
              placeholder="Enter family name"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-12"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-white/70 text-sm">Family Members ({members.length}/10)</label>
                {members.length < 10 && (
                  <button type="button" onClick={addMember} className="text-violet-400 text-sm hover:text-violet-300">
                    + Add Member
                  </button>
                )}
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {members.map((member, index) => (
                  <div key={index} className="glass rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.name.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateMember(index, 'name', e.target.value)}
                          className="input-field text-sm py-2"
                          placeholder="Name"
                          required
                        />
                        <input
                          type="text"
                          value={member.pin}
                          onChange={(e) => updateMember(index, 'pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="input-field text-sm py-2"
                          placeholder="4-digit PIN"
                          maxLength={4}
                          required
                        />
                      </div>
                      {members.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMember(index)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 spinner" />
                Loading...
              </span>
            ) : isRegister ? 'Create Family' : 'Login'}
          </button>

          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="w-full text-center text-white/60 hover:text-white text-sm"
          >
            {isRegister ? 'Already have a family? Login' : "New family? Register"}
          </button>
        </form>
      </div>
    </motion.div>
  )
}

// Member Select Screen
function MemberSelectScreen({ members, onSelect, onLogout }: {
  members: Member[]
  onSelect: (member: Member) => void
  onLogout: () => void
}) {
  return (
    <motion.div
      className="min-h-screen p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Who's logging in?</h1>
          <button onClick={onLogout} className="text-white/60 hover:text-white p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {members.map((member) => (
            <motion.button
              key={member.id}
              onClick={() => onSelect(member)}
              className="glass rounded-2xl p-6 text-center card-hover"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                style={{ backgroundColor: member.avatar_color }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-white font-medium">{member.name}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// PIN Entry Screen
function PinEntryScreen({ member, onVerified, onBack }: {
  member: Member
  onVerified: (member: Member) => void
  onBack: () => void
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePinInput = async (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      
      if (newPin.length === 4) {
        setLoading(true)
        setError('')
        try {
          const result = await api.post<{ token: string; member: Member }>(
            '/auth/verify-pin',
            { memberId: member.id, pin: newPin }
          )
          api.setToken(result.token)
          onVerified(result.member)
        } catch (err) {
          setError('Invalid PIN')
          setPin('')
        } finally {
          setLoading(false)
        }
      }
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError('')
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4"
        style={{ backgroundColor: member.avatar_color }}
      >
        {member.name.charAt(0).toUpperCase()}
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">{member.name}</h2>
      <p className="text-white/60 mb-8">Enter your PIN</p>

      {/* PIN Display */}
      <div className="flex gap-3 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              pin.length > i ? 'bg-violet-500 scale-110' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'back'].map((num, i) => (
          <div key={i} className="flex justify-center">
            {num === null ? (
              <div className="w-[4.5rem]" />
            ) : num === 'back' ? (
              <button
                onClick={handleBackspace}
                disabled={loading}
                className="number-pad-btn"
              >
                ←
              </button>
            ) : (
              <button
                onClick={() => handlePinInput(String(num))}
                disabled={loading}
                className="number-pad-btn"
              >
                {num}
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// Theme Modal with Drag-to-Position
function ThemeModal({ onClose, settings, onSave }: {
  onClose: () => void
  settings: FamilySettings | null
  onSave: (updates: Partial<FamilySettings>) => Promise<void>
}) {
  const [theme, setTheme] = useState(settings?.background_type || 'gradient')
  const [gradientId, setGradientId] = useState(settings?.background_value || 'default')
  const [backgroundUrl, setBackgroundUrl] = useState(settings?.background_type === 'photo' ? settings?.background_value : '')
  const [backgroundFit, setBackgroundFit] = useState<'cover' | 'contain' | 'fill'>(settings?.background_fit as 'cover' | 'contain' | 'fill' || 'cover')
  const [backgroundPosition, setBackgroundPosition] = useState(settings?.background_position || '50% 50%')
  const [backgroundBlur, setBackgroundBlur] = useState(settings?.background_blur || 0)
  const [backgroundOverlay, setBackgroundOverlay] = useState(settings?.background_overlay || 0.6)
  const [accentColor, setAccentColor] = useState(settings?.accent_color || '#8b5cf6')
  const [isDragging, setIsDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Parse position for preview
  const parsePosition = (pos: string) => {
    const parts = pos.split(' ')
    return {
      x: parseFloat(parts[0]) || 50,
      y: parseFloat(parts[1]) || 50
    }
  }

  const position = parsePosition(backgroundPosition)

  // Handle drag for background positioning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (theme !== 'photo' || !backgroundUrl) return
    setIsDragging(true)
    updatePositionFromEvent(e)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    updatePositionFromEvent(e)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (theme !== 'photo' || !backgroundUrl) return
    setIsDragging(true)
    updatePositionFromTouch(e)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    updatePositionFromTouch(e)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const updatePositionFromEvent = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setBackgroundPosition(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  const updatePositionFromTouch = (e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length === 0) return
    const touch = e.touches[0]
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100))
    setBackgroundPosition(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'background')

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${api.token}`
        },
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')
      const data = await response.json()
      setBackgroundUrl(data.url)
      setTheme('photo')
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        background_type: theme as 'gradient' | 'photo',
        background_value: theme === 'gradient' ? gradientId : backgroundUrl,
        background_fit: backgroundFit,
        background_position: backgroundPosition,
        background_blur: backgroundBlur,
        background_overlay: backgroundOverlay,
        accent_color: accentColor
      })
      onClose()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const currentGradient = GRADIENT_THEMES.find(g => g.id === gradientId)?.value || GRADIENT_THEMES[0].value

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content p-0 max-w-lg overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme & Background
          </h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Preview with Drag-to-Position */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Preview {theme === 'photo' && backgroundUrl && '(Drag to reposition)'}
            </label>
            <div
              ref={containerRef}
              className={`relative h-40 rounded-xl overflow-hidden border-2 ${isDragging ? 'border-violet-500' : 'border-white/20'} ${theme === 'photo' && backgroundUrl ? 'cursor-move' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {theme === 'gradient' ? (
                <div className="absolute inset-0" style={{ background: currentGradient }} />
              ) : backgroundUrl ? (
                <>
                  <img
                    src={backgroundUrl}
                    alt="Background"
                    className="absolute inset-0 w-full h-full"
                    style={{
                      objectFit: backgroundFit,
                      objectPosition: backgroundPosition,
                      filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined
                    }}
                    draggable={false}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: `rgba(0,0,0,${backgroundOverlay})` }}
                  />
                  {/* Position indicator */}
                  <div
                    className="absolute w-6 h-6 bg-violet-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                  <p className="text-white/40">No background selected</p>
                </div>
              )}
            </div>
          </div>

          {/* Theme Type Selection */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Background Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('gradient')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  theme === 'gradient' ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Gradient
              </button>
              <button
                onClick={() => setTheme('photo')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  theme === 'photo' ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Photo
              </button>
            </div>
          </div>

          {/* Gradient Selection */}
          {theme === 'gradient' && (
            <div>
              <label className="block text-white/70 text-sm mb-2">Gradient Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {GRADIENT_THEMES.map((gradient) => (
                  <button
                    key={gradient.id}
                    onClick={() => setGradientId(gradient.id)}
                    className={`h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      gradientId === gradient.id ? 'border-violet-500 scale-105' : 'border-transparent'
                    }`}
                  >
                    <div className="w-full h-full" style={{ background: gradient.value }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Photo Upload */}
          {theme === 'photo' && (
            <>
              <div>
                <label className="block text-white/70 text-sm mb-2">Upload Background</label>
                <label className="block w-full py-3 px-4 rounded-lg bg-white/10 border border-white/20 text-center cursor-pointer hover:bg-white/15 transition-all">
                  {uploading ? 'Uploading...' : 'Choose Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {backgroundUrl && (
                <>
                  {/* Fit Options */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Image Fit</label>
                    <div className="flex gap-2">
                      {(['cover', 'contain', 'fill'] as const).map((fit) => (
                        <button
                          key={fit}
                          onClick={() => setBackgroundFit(fit)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${
                            backgroundFit === fit ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {fit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Blur Slider */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Blur: {backgroundBlur}px</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={backgroundBlur}
                      onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                  </div>

                  {/* Overlay Slider */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Overlay: {Math.round(backgroundOverlay * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={backgroundOverlay * 100}
                      onChange={(e) => setBackgroundOverlay(Number(e.target.value) / 100)}
                      className="w-full accent-violet-500"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Accent Color */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Accent Color</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.slice(0, 18).map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    accentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Settings Modal Component
function SettingsModal({ onClose, family, members, currentMember, onUpdate }: {
  onClose: () => void
  family: { id: string; name: string }
  members: Member[]
  currentMember: Member
  onUpdate: () => void
}) {
  const [tab, setTab] = useState<'family' | 'members' | 'exercises' | 'theme'>('family')
  const [familyName, setFamilyName] = useState(family.name)
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Member management
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [memberName, setMemberName] = useState('')
  const [memberPin, setMemberPin] = useState('')
  const [memberColor, setMemberColor] = useState(AVATAR_COLORS[0])
  const [addingMember, setAddingMember] = useState(false)

  // Custom exercises
  const [customExercises, setCustomExercises] = useState<any[]>([])
  const [exerciseName, setExerciseName] = useState('')
  const [exerciseDuration, setExerciseDuration] = useState(30)
  const [addingExercise, setAddingExercise] = useState(false)

  useEffect(() => {
    if (tab === 'exercises') {
      loadCustomExercises()
    }
  }, [tab])

  const loadCustomExercises = async () => {
    try {
      const exercises = await api.fetch('/exercises/custom')
      setCustomExercises(Array.isArray(exercises) ? exercises : [])
    } catch (err) {
      console.error('Failed to load custom exercises:', err)
    }
  }

  const handleAddExercise = async () => {
    if (!exerciseName.trim()) {
      setError('Exercise name is required')
      return
    }

    setSaving(true)
    setError('')
    try {
      await api.post('/exercises/custom', {
        name: exerciseName,
        default_duration: exerciseDuration
      })
      await loadCustomExercises()
      setAddingExercise(false)
      setExerciseName('')
      setExerciseDuration(30)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Delete this custom exercise?')) return

    setSaving(true)
    setError('')
    try {
      await api.delete(`/exercises/custom/${exerciseId}`)
      await loadCustomExercises()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateFamilyName = async () => {
    if (!familyName.trim()) {
      setError('Family name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.put('/family', { name: familyName })
      onUpdate()
      setError('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFamily = async () => {
    if (!deletePassword) {
      setError('Password required to delete family')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.delete('/family', { password: deletePassword })
      localStorage.removeItem('token')
      window.location.reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateMember = async () => {
    if (!editingMember) return
    if (!memberName.trim()) {
      setError('Member name is required')
      return
    }
    if (memberPin && (memberPin.length !== 4 || !/^\d{4}$/.test(memberPin))) {
      setError('PIN must be exactly 4 digits')
      return
    }

    setSaving(true)
    setError('')
    try {
      await api.put(`/members/${editingMember.id}`, {
        name: memberName,
        avatar_color: memberColor,
        ...(memberPin ? { pin: memberPin } : {})
      })
      onUpdate()
      setEditingMember(null)
      setMemberName('')
      setMemberPin('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async () => {
    if (!memberName.trim()) {
      setError('Member name is required')
      return
    }
    if (memberPin.length !== 4 || !/^\d{4}$/.test(memberPin)) {
      setError('PIN must be exactly 4 digits')
      return
    }

    setSaving(true)
    setError('')
    try {
      await api.post('/members', {
        name: memberName,
        pin: memberPin,
        avatarColor: memberColor
      })
      onUpdate()
      setAddingMember(false)
      setMemberName('')
      setMemberPin('')
      setMemberColor(AVATAR_COLORS[0])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this family member? All their data will be deleted.')) {
      return
    }

    setSaving(true)
    setError('')
    try {
      await api.delete(`/members/${memberId}`)
      onUpdate()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const startEditMember = (member: Member) => {
    setEditingMember(member)
    setMemberName(member.name)
    setMemberColor(member.avatar_color)
    setMemberPin('')
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content p-0 max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setTab('family')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              tab === 'family'
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Family
          </button>
          <button
            onClick={() => setTab('members')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              tab === 'members'
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setTab('exercises')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              tab === 'exercises'
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Exercises
          </button>
          <button
            onClick={() => setTab('theme')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              tab === 'theme'
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Theme
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Family Tab */}
          {tab === 'family' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white/70 text-sm mb-2">Family Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Enter family name"
                  />
                  <button
                    onClick={handleUpdateFamilyName}
                    disabled={saving || familyName === family.name}
                    className="btn-primary px-4"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h4 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h4>
                <p className="text-white/60 text-sm mb-4">
                  Deleting your family will permanently remove all data including members, goals, and progress.
                </p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    Delete Family
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter family password to confirm"
                      className="input-field"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteFamily}
                        disabled={saving}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
                      >
                        {saving ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeletePassword('')
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {tab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/70 text-sm">
                  {members.length} of 10 members
                </p>
                {members.length < 10 && !addingMember && (
                  <button
                    onClick={() => setAddingMember(true)}
                    className="text-violet-400 text-sm hover:text-violet-300 flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </button>
                )}
              </div>

              {/* Add Member Form */}
              {addingMember && (
                <div className="glass rounded-xl p-4 mb-4">
                  <h4 className="text-white font-semibold mb-3">Add New Member</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Member name"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={memberPin}
                      onChange={(e) => setMemberPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="4-digit PIN"
                      maxLength={4}
                      className="input-field"
                    />
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Avatar Color</label>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_COLORS.slice(0, 18).map((color) => (
                          <button
                            key={color}
                            onClick={() => setMemberColor(color)}
                            className={`w-8 h-8 rounded-full transition-all ${
                              memberColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddMember} disabled={saving} className="btn-primary flex-1">
                        {saving ? 'Adding...' : 'Add Member'}
                      </button>
                      <button
                        onClick={() => {
                          setAddingMember(false)
                          setMemberName('')
                          setMemberPin('')
                          setError('')
                        }}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Members List */}
              {members.map((member) => (
                <div key={member.id} className="glass rounded-xl p-4">
                  {editingMember?.id === member.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        placeholder="Member name"
                        className="input-field"
                      />
                      <input
                        type="text"
                        value={memberPin}
                        onChange={(e) => setMemberPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="New PIN (leave blank to keep current)"
                        maxLength={4}
                        className="input-field"
                      />
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Avatar Color</label>
                        <div className="flex flex-wrap gap-2">
                          {AVATAR_COLORS.slice(0, 18).map((color) => (
                            <button
                              key={color}
                              onClick={() => setMemberColor(color)}
                              className={`w-8 h-8 rounded-full transition-all ${
                                memberColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleUpdateMember} disabled={saving} className="btn-primary flex-1">
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingMember(null)
                            setMemberName('')
                            setMemberPin('')
                            setError('')
                          }}
                          className="btn-secondary flex-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ backgroundColor: member.avatar_color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{member.name}</p>
                        {member.id === currentMember.id && (
                          <span className="text-xs text-violet-400">Current User</span>
                        )}
                      </div>
                      <button
                        onClick={() => startEditMember(member)}
                        className="text-violet-400 hover:text-violet-300 px-3 py-1 text-sm"
                      >
                        Edit
                      </button>
                      {members.length > 2 && (
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={saving}
                          className="text-red-400 hover:text-red-300 px-3 py-1 text-sm"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Exercises Tab */}
          {tab === 'exercises' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/70 text-sm">
                  Custom exercise activities for the family
                </p>
                {!addingExercise && (
                  <button
                    onClick={() => setAddingExercise(true)}
                    className="text-violet-400 text-sm hover:text-violet-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Exercise
                  </button>
                )}
              </div>

              {/* Add Exercise Form */}
              {addingExercise && (
                <div className="glass rounded-xl p-4 mb-4">
                  <h4 className="text-white font-semibold mb-3">Add Custom Exercise</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={exerciseName}
                      onChange={(e) => setExerciseName(e.target.value)}
                      placeholder="Exercise name (e.g., Yoga, Basketball)"
                      className="input-field"
                    />
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Default Duration (minutes)</label>
                      <input
                        type="number"
                        value={exerciseDuration}
                        onChange={(e) => setExerciseDuration(Number(e.target.value))}
                        min="5"
                        className="input-field"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddExercise} disabled={saving} className="btn-primary flex-1">
                        {saving ? 'Adding...' : 'Add Exercise'}
                      </button>
                      <button
                        onClick={() => {
                          setAddingExercise(false)
                          setExerciseName('')
                          setExerciseDuration(30)
                          setError('')
                        }}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Exercises List */}
              {customExercises.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">
                  No custom exercises yet. Add your favorite activities!
                </p>
              ) : (
                customExercises.map((exercise) => (
                  <div key={exercise.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{exercise.name}</p>
                      <p className="text-white/50 text-xs">Default: {exercise.default_duration} minutes</p>
                      {exercise.created_by_name && (
                        <p className="text-white/40 text-xs mt-1">Added by {exercise.created_by_name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteExercise(exercise.id)}
                      disabled={saving}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Theme Tab - Use existing ThemeModal content */}
          {tab === 'theme' && (
            <div className="text-white/60 text-center py-8">
              Theme customization will be shown here
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm mt-4">
              {error}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Dashboard Screen
function DashboardScreen({ currentMember, members, onViewMember, onLogout }: {
  currentMember: Member
  members: Member[]
  onViewMember: (member: DashboardMember) => void
  onLogout: () => void
}) {
  const [dashboard, setDashboard] = useState<DashboardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settings, setSettings] = useState<FamilySettings | null>(null)
  const [family, setFamily] = useState<{ id: string; name: string } | null>(null)

  const loadSettings = async () => {
    try {
      const data = await api.fetch<FamilySettings>('/settings')
      setSettings(data)
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const loadFamily = async () => {
    try {
      const data = await api.fetch<{ id: string; name: string }>('/family')
      setFamily(data)
    } catch (err) {
      console.error('Failed to load family:', err)
    }
  }

  const saveSettings = async (updates: Partial<FamilySettings>) => {
    await api.put('/settings', updates)
    await loadSettings()
  }

  const loadDashboard = async () => {
    try {
      const data = await api.fetch<DashboardMember[]>('/dashboard')
      setDashboard(data)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    await loadDashboard()
    await loadFamily()
  }

  useEffect(() => {
    loadDashboard()
    loadSettings()
    loadFamily()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 spinner" />
      </div>
    )
  }

  const currentMemberData = dashboard.find(m => m.id === currentMember.id)

  return (
    <motion.div
      className="min-h-screen pb-24"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <div className="glass-strong sticky top-0 z-10 px-6 py-4 safe-top">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
              style={{ backgroundColor: currentMember.avatar_color }}
            >
              {currentMember.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{currentMember.name}</p>
              <p className="text-white/50 text-xs">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowThemeModal(true)} className="text-white/60 hover:text-white p-2">
              <Palette className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="text-white/60 hover:text-white p-2">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="text-white/60 hover:text-white p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 max-w-2xl mx-auto">
        {/* Today's Progress - Clickable */}
        {currentMemberData && (
          <motion.button
            onClick={() => onViewMember(currentMemberData)}
            className="w-full glass rounded-3xl p-6 mb-6 text-left card-hover cursor-pointer"
            variants={fadeInUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Today's Progress</h2>
              <ChevronRight className="w-5 h-5 text-white/50" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Water Progress */}
              <div className="text-center">
                <WaterGlass percentage={(currentMemberData.water_progress.current / currentMemberData.water_progress.target) * 100} />
                <p className="mt-3 text-white font-medium">
                  {(currentMemberData.water_progress.current / 1000).toFixed(1)}L / {(currentMemberData.water_progress.target / 1000).toFixed(1)}L
                </p>
                <p className="text-white/50 text-sm">Water</p>
              </div>

              {/* Exercise Progress */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto">
                  <ProgressRing
                    progress={(currentMemberData.exercise_progress.current / currentMemberData.exercise_progress.target) * 100}
                    size={96}
                    strokeWidth={8}
                    color="#22c55e"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-emerald-400 mb-1" />
                    <span className="text-white font-semibold">
                      {currentMemberData.exercise_progress.current}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-white font-medium">
                  {currentMemberData.exercise_progress.current} / 30 min
                </p>
                <p className="text-white/50 text-sm">Exercise</p>
              </div>
            </div>

            {/* Goal Progress */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-white/70 text-sm">
                {currentMemberData.completed_count} / {currentMemberData.total_goals} daily goals
              </span>
            </div>
          </motion.button>
        )}

        {/* Family Overview */}
        <h3 className="text-lg font-semibold text-white mb-4">Family Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          {dashboard.map((member) => {
            const isCurrentUser = member.id === currentMember.id
            return (
              <motion.button
                key={member.id}
                onClick={() => onViewMember(member)}
                className={`glass rounded-2xl p-4 text-left card-hover ${isCurrentUser ? 'ring-2 ring-violet-500' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: member.avatar_color }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{member.name}</p>
                    {isCurrentUser && (
                      <span className="text-xs text-violet-400">You</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-sky-400" />
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (member.water_progress.current / member.water_progress.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (member.exercise_progress.current / member.exercise_progress.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span className="text-white/60 text-xs">
                      {member.completed_count}/{member.total_goals}
                    </span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Theme Modal */}
      <AnimatePresence>
        {showThemeModal && (
          <ThemeModal
            onClose={() => setShowThemeModal(false)}
            settings={settings}
            onSave={saveSettings}
          />
        )}
        {showSettingsModal && family && (
          <SettingsModal
            onClose={() => setShowSettingsModal(false)}
            family={family}
            members={members}
            currentMember={currentMember}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Member Detail Screen
function MemberDetailScreen({ member, currentMember, onBack, onUpdate }: {
  member: DashboardMember
  currentMember: Member
  onBack: () => void
  onUpdate: () => void
}) {
  const [waterAmount, setWaterAmount] = useState(250)
  const [exerciseMinutes, setExerciseMinutes] = useState(30)
  const [exerciseActivity, setExerciseActivity] = useState('Walking')
  const [showWaterModal, setShowWaterModal] = useState(false)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showWaterSettingsModal, setShowWaterSettingsModal] = useState(false)
  const [goals, setGoals] = useState<Goal[]>(member.goals || [])
  const [waterData, setWaterData] = useState(member.water_progress)
  const [exerciseData, setExerciseData] = useState(member.exercise_progress)

  // Water goal settings
  const waterGoal = goals.find(g => g.type === 'water')
  const [waterTarget, setWaterTarget] = useState(waterGoal?.target_value || 2000)
  const [waterUnit, setWaterUnit] = useState(waterGoal?.target_unit || 'ml')
  const [waterError, setWaterError] = useState('')

  // Photo management
  const [uploading, setUploading] = useState(false)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(member.profile_photo_url)

  // Stats modal
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month'>('week')
  const [statsData, setStatsData] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Custom goal management
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalFrequency, setGoalFrequency] = useState<'daily' | 'weekly'>('daily')
  const [goalDueTime, setGoalDueTime] = useState('')
  const [goalReminderEnabled, setGoalReminderEnabled] = useState(false)
  const [goalReminderTime, setGoalReminderTime] = useState('')
  const [goalError, setGoalError] = useState('')

  const isOwnProfile = member.id === currentMember.id
  const customGoals = goals.filter(g => g.type === 'custom' && g.is_custom)
  const dailyCustomGoals = customGoals.filter(g => g.frequency === 'daily')
  const weeklyCustomGoals = customGoals.filter(g => g.frequency === 'weekly')

  const loadData = async () => {
    try {
      const [waterRes, exerciseRes] = await Promise.all([
        api.fetch<{ total: number; target: number }>(`/water?memberId=${member.id}`),
        api.fetch<{ total: number; target: number }>(`/exercise?memberId=${member.id}`)
      ])
      setWaterData({ current: waterRes.total, target: waterRes.target })
      setExerciseData({ current: exerciseRes.total, target: exerciseRes.target })
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const addWater = async () => {
    try {
      await api.post('/water', { memberId: member.id, amount_ml: waterAmount })
      await loadData()
      setShowWaterModal(false)
      onUpdate()
    } catch (err) {
      console.error('Failed to add water:', err)
    }
  }

  const addExercise = async () => {
    try {
      await api.post('/exercise', {
        memberId: member.id,
        duration_minutes: exerciseMinutes,
        activity: exerciseActivity
      })
      await loadData()
      setShowExerciseModal(false)
      onUpdate()
    } catch (err) {
      console.error('Failed to add exercise:', err)
    }
  }

  const toggleGoal = async (goal: Goal) => {
    try {
      await api.post(`/goals/${goal.id}/complete`, { memberId: member.id })
      setGoals(goals.map(g =>
        g.id === goal.id ? { ...g, is_completed: !g.is_completed } : g
      ))
      onUpdate()
    } catch (err) {
      console.error('Failed to toggle goal:', err)
    }
  }

  const openAddGoalModal = () => {
    setGoalTitle('')
    setGoalDescription('')
    setGoalFrequency('daily')
    setGoalDueTime('')
    setGoalReminderEnabled(false)
    setGoalReminderTime('')
    setGoalError('')
    setEditingGoal(null)
    setShowAddGoalModal(true)
  }

  const openEditGoalModal = (goal: Goal) => {
    setGoalTitle(goal.title)
    setGoalDescription(goal.description || '')
    setGoalFrequency(goal.frequency)
    setGoalDueTime(goal.due_time || '')
    setGoalReminderEnabled(goal.reminder_enabled)
    setGoalReminderTime(goal.reminder_time || '')
    setGoalError('')
    setEditingGoal(goal)
    setShowAddGoalModal(true)
  }

  const handleSaveGoal = async () => {
    if (!goalTitle.trim()) {
      setGoalError('Goal title is required')
      return
    }

    const customGoalsOfFrequency = customGoals.filter(g => g.frequency === goalFrequency)
    if (!editingGoal && customGoalsOfFrequency.length >= 4) {
      setGoalError(`Maximum 4 ${goalFrequency} custom goals allowed`)
      return
    }

    try {
      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, {
          title: goalTitle,
          description: goalDescription || null,
          frequency: goalFrequency,
          due_time: goalDueTime || null,
          reminder_enabled: goalReminderEnabled,
          reminder_time: goalReminderTime || null
        })
      } else {
        await api.post('/goals', {
          memberId: member.id,
          type: 'custom',
          title: goalTitle,
          description: goalDescription || null,
          frequency: goalFrequency,
          due_time: goalDueTime || null,
          reminder_enabled: goalReminderEnabled,
          reminder_time: goalReminderTime || null
        })
      }

      // Reload goals
      const updatedMember = await api.fetch<DashboardMember>(`/dashboard`)
      const memberData = Array.isArray(updatedMember)
        ? updatedMember.find(m => m.id === member.id)
        : updatedMember
      if (memberData?.goals) {
        setGoals(memberData.goals)
      }

      setShowAddGoalModal(false)
      onUpdate()
    } catch (err) {
      setGoalError((err as Error).message)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      await api.delete(`/goals/${goalId}`)
      setGoals(goals.filter(g => g.id !== goalId))
      onUpdate()
    } catch (err) {
      console.error('Failed to delete goal:', err)
    }
  }

  const handleUpdateWaterGoal = async () => {
    if (!waterGoal) return
    if (waterTarget <= 0) {
      setWaterError('Target must be greater than 0')
      return
    }

    try {
      const targetInMl = convertWaterToMl(waterTarget, waterUnit)
      await api.put(`/goals/${waterGoal.id}`, {
        target_value: targetInMl,
        target_unit: waterUnit
      })

      // Reload goals
      const updatedMember = await api.fetch<DashboardMember>(`/dashboard`)
      const memberData = Array.isArray(updatedMember)
        ? updatedMember.find(m => m.id === member.id)
        : updatedMember
      if (memberData?.goals) {
        setGoals(memberData.goals)
      }

      setShowWaterSettingsModal(false)
      onUpdate()
    } catch (err) {
      setWaterError((err as Error).message)
    }
  }

  const handleUploadProfilePhoto = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'profile')
        formData.append('memberId', member.id)

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${api.token}` },
          body: formData
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()
        setProfilePhotoUrl(data.url)
        onUpdate()
      } catch (err) {
        console.error('Failed to upload photo:', err)
        alert('Failed to upload photo')
      } finally {
        setUploading(false)
      }
    }

    input.click()
  }

  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const data = await api.fetch(`/stats/${statsPeriod}/${member.id}`)
      setStatsData(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const openStatsModal = () => {
    setShowStatsModal(true)
    loadStats()
  }

  const dailyGoals = goals.filter(g => g.frequency !== 'weekly')
  const weeklyGoals = goals.filter(g => g.frequency === 'weekly')

  // Calculate water display values
  const waterUnitData = WATER_UNITS.find(u => u.id === (waterGoal?.target_unit || 'ml'))
  const displayWaterCurrent = convertMlToUnit(waterData.current, waterGoal?.target_unit || 'ml')
  const displayWaterTarget = convertMlToUnit(waterData.target, waterGoal?.target_unit || 'ml')
  const waterUnitLabel = waterUnitData?.id || 'ml'

  return (
    <motion.div
      className="min-h-screen pb-24"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <div className="glass-strong sticky top-0 z-10 px-6 py-4 safe-top">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-semibold text-white">
            {isOwnProfile ? 'My Goals' : `${member.name}'s Goals`}
          </h1>
          <button
            onClick={openStatsModal}
            className="text-white/60 hover:text-white p-2"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6 py-4 max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="glass rounded-3xl p-6 mb-6 text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={member.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ backgroundColor: member.avatar_color }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
            {isOwnProfile && (
              <button
                onClick={handleUploadProfilePhoto}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-violet-500 rounded-full p-2 hover:bg-violet-600 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </button>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{member.name}</h2>
          {isOwnProfile && <span className="text-violet-400 text-sm">Your Profile</span>}
        </div>

        {/* Water & Exercise Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Water Card */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <Droplets className="w-5 h-5 text-sky-400" />
              {isOwnProfile && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowWaterSettingsModal(true)}
                    className="text-sky-400/70 text-sm hover:text-sky-400"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowWaterModal(true)}
                    className="text-sky-400 text-sm hover:text-sky-300"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>
            <WaterGlass percentage={(waterData.current / waterData.target) * 100} />
            <p className="text-center text-white mt-2">
              {displayWaterCurrent.toFixed(1)}{waterUnitLabel} / {displayWaterTarget.toFixed(1)}{waterUnitLabel}
            </p>
          </div>

          {/* Exercise Card */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <Dumbbell className="w-5 h-5 text-emerald-400" />
              {isOwnProfile && (
                <button
                  onClick={() => setShowExerciseModal(true)}
                  className="text-emerald-400 text-sm hover:text-emerald-300"
                >
                  + Add
                </button>
              )}
            </div>
            <div className="relative w-24 h-24 mx-auto">
              <ProgressRing
                progress={(exerciseData.current / exerciseData.target) * 100}
                size={96}
                strokeWidth={8}
                color="#22c55e"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-lg">{exerciseData.current}</span>
                <span className="text-white/50 text-xs">min</span>
              </div>
            </div>
            <p className="text-center text-white mt-2">
              {exerciseData.current} / 30 min
            </p>
          </div>
        </div>

        {/* Daily Goals */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Daily Goals
          </h3>
          <div className="space-y-3">
            {dailyGoals.filter(g => g.type !== 'water' && g.type !== 'exercise').map((goal) => (
              <motion.div
                key={goal.id}
                className={`glass rounded-xl p-4 flex items-center gap-4 ${goal.is_completed ? 'bg-emerald-500/10' : ''}`}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => isOwnProfile && toggleGoal(goal)}
                  disabled={!isOwnProfile}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    goal.is_completed
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-white/30 hover:border-emerald-500'
                  }`}
                >
                  {goal.is_completed && <Check className="w-5 h-5" />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${goal.is_completed ? 'text-white/60 line-through' : 'text-white'}`}>
                    {goal.title}
                  </p>
                  {goal.description && (
                    <p className="text-white/50 text-sm">{goal.description}</p>
                  )}
                  {goal.type === 'assigned' && goal.assigned_by_name && (
                    <p className="text-violet-400 text-xs mt-1">
                      From {goal.assigned_by_name}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Custom Goals Management */}
        {isOwnProfile && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-400" />
                Custom Goals
              </h3>
              {customGoals.length < 8 && (
                <button
                  onClick={openAddGoalModal}
                  className="text-violet-400 text-sm hover:text-violet-300 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Goal
                </button>
              )}
            </div>
            <div className="space-y-3">
              {customGoals.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">
                  No custom goals yet. Click &quot;Add Goal&quot; to create one.
                </p>
              ) : (
                customGoals.map((goal) => (
                  <div key={goal.id} className="glass rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleGoal(goal)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          goal.is_completed
                            ? 'bg-violet-500 text-white'
                            : 'border-2 border-white/30 hover:border-violet-500'
                        }`}
                      >
                        {goal.is_completed && <Check className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium ${goal.is_completed ? 'text-white/60 line-through' : 'text-white'}`}>
                            {goal.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditGoalModal(goal)}
                              className="text-violet-400 hover:text-violet-300 p-1"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {goal.description && (
                          <p className="text-white/50 text-sm mt-1">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                          <span className="capitalize">{goal.frequency}</span>
                          {goal.due_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {goal.due_time}
                            </span>
                          )}
                          {goal.reminder_enabled && (
                            <span className="flex items-center gap-1">
                              <Bell className="w-3 h-3" />
                              Reminder
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Weekly Goals */}
        {weeklyGoals.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-400" />
              Weekly Goals
            </h3>
            <div className="space-y-3">
              {weeklyGoals.map((goal) => (
                <motion.div
                  key={goal.id}
                  className={`glass rounded-xl p-4 flex items-center gap-4 border-l-4 border-violet-500 ${goal.is_completed ? 'bg-violet-500/10' : ''}`}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => isOwnProfile && toggleGoal(goal)}
                    disabled={!isOwnProfile}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      goal.is_completed
                        ? 'bg-violet-500 text-white'
                        : 'border-2 border-white/30 hover:border-violet-500'
                    }`}
                  >
                    {goal.is_completed && <Check className="w-5 h-5" />}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${goal.is_completed ? 'text-white/60 line-through' : 'text-white'}`}>
                      {goal.title}
                    </p>
                    {goal.description && (
                      <p className="text-white/50 text-sm">{goal.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Water Modal */}
      <AnimatePresence>
        {showWaterModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWaterModal(false)}
          >
            <motion.div
              className="modal-content p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add Water</h3>
                <button onClick={() => setShowWaterModal(false)} className="text-white/60 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setWaterAmount(Math.max(50, waterAmount - 50))}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                >
                  <Minus className="w-5 h-5 text-white" />
                </button>
                <div className="text-center">
                  <span className="text-4xl font-bold text-white">{waterAmount}</span>
                  <span className="text-xl text-white/60 ml-1">ml</span>
                </div>
                <button
                  onClick={() => setWaterAmount(Math.min(2000, waterAmount + 50))}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {[100, 250, 500, 750].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setWaterAmount(amount)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      waterAmount === amount
                        ? 'bg-sky-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {amount}ml
                  </button>
                ))}
              </div>

              <button onClick={addWater} className="btn-primary w-full">
                Add {waterAmount}ml
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Modal */}
      <AnimatePresence>
        {showExerciseModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExerciseModal(false)}
          >
            <motion.div
              className="modal-content p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Log Exercise</h3>
                <button onClick={() => setShowExerciseModal(false)} className="text-white/60 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-white/70 text-sm mb-2">Activity</label>
                <select
                  value={exerciseActivity}
                  onChange={(e) => setExerciseActivity(e.target.value)}
                  className="input-field"
                >
                  {['Walking', 'Running', 'Cycling', 'Swimming', 'Yoga', 'Gym', 'Sports', 'HIIT', 'Stretching'].map((activity) => (
                    <option key={activity} value={activity}>{activity}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setExerciseMinutes(Math.max(5, exerciseMinutes - 5))}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                >
                  <Minus className="w-5 h-5 text-white" />
                </button>
                <div className="text-center">
                  <span className="text-4xl font-bold text-white">{exerciseMinutes}</span>
                  <span className="text-xl text-white/60 ml-1">min</span>
                </div>
                <button
                  onClick={() => setExerciseMinutes(Math.min(180, exerciseMinutes + 5))}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
    </div>

              <button onClick={addExercise} className="btn-primary w-full">
                Log {exerciseMinutes} minutes
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Water Settings Modal */}
        {showWaterSettingsModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWaterSettingsModal(false)}
          >
            <motion.div
              className="modal-content p-6 max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Water Goal Settings</h3>
                <button onClick={() => setShowWaterSettingsModal(false)} className="text-white/60 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Daily Target</label>
                  <input
                    type="number"
                    value={waterTarget}
                    onChange={(e) => setWaterTarget(Number(e.target.value))}
                    min="1"
                    step="0.1"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">Unit</label>
                  <select
                    value={waterUnit}
                    onChange={(e) => setWaterUnit(e.target.value)}
                    className="input-field"
                  >
                    {WATER_UNITS.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                {waterError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                    {waterError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowWaterSettingsModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateWaterGoal}
                    className="btn-primary flex-1"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Add/Edit Goal Modal */}
        {showAddGoalModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddGoalModal(false)}
          >
            <motion.div
              className="modal-content p-6 max-w-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingGoal ? 'Edit Goal' : 'Add Custom Goal'}
                </h3>
                <button onClick={() => setShowAddGoalModal(false)} className="text-white/60 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Goal Title *</label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g., Read for 30 minutes"
                    className="input-field"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">Description (optional)</label>
                  <textarea
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="Add more details about this goal..."
                    className="input-field resize-none"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">Frequency</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGoalFrequency('daily')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        goalFrequency === 'daily'
                          ? 'bg-violet-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => setGoalFrequency('weekly')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        goalFrequency === 'weekly'
                          ? 'bg-violet-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">Due Time (optional)</label>
                  <input
                    type="time"
                    value={goalDueTime}
                    onChange={(e) => setGoalDueTime(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="reminder-enabled"
                    checked={goalReminderEnabled}
                    onChange={(e) => setGoalReminderEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 bg-white/10 text-violet-500 focus:ring-violet-500"
                  />
                  <label htmlFor="reminder-enabled" className="text-white/70 text-sm cursor-pointer">
                    Enable reminder notification
                  </label>
                </div>

                {goalReminderEnabled && (
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Reminder Time</label>
                    <input
                      type="time"
                      value={goalReminderTime}
                      onChange={(e) => setGoalReminderTime(e.target.value)}
                      className="input-field"
                    />
                  </div>
                )}

                {goalError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                    {goalError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddGoalModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGoal}
                    className="btn-primary flex-1"
                  >
                    {editingGoal ? 'Save Changes' : 'Add Goal'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Stats Modal */}
        {showStatsModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStatsModal(false)}
          >
            <motion.div
              className="modal-content p-6 max-w-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Statistics</h3>
                <button onClick={() => setShowStatsModal(false)} className="text-white/60 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      setStatsPeriod('week')
                      loadStats()
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      statsPeriod === 'week'
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => {
                      setStatsPeriod('month')
                      loadStats()
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      statsPeriod === 'month'
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    Month
                  </button>
                </div>

                {loadingStats ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                ) : statsData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass rounded-lg p-4">
                        <p className="text-white/60 text-xs mb-1">Completion</p>
                        <p className="text-2xl font-bold text-white">{statsData.summary.avg_completion}%</p>
                      </div>
                      <div className="glass rounded-lg p-4">
                        <p className="text-white/60 text-xs mb-1">Perfect Days</p>
                        <p className="text-2xl font-bold text-white">{statsData.summary.perfect_days}</p>
                      </div>
                      <div className="glass rounded-lg p-4">
                        <p className="text-white/60 text-xs mb-1">Current Streak</p>
                        <p className="text-2xl font-bold text-white">{statsData.summary.current_streak}</p>
                      </div>
                      <div className="glass rounded-lg p-4">
                        <p className="text-white/60 text-xs mb-1">Water</p>
                        <p className="text-2xl font-bold text-white">{(statsData.summary.total_water / 1000).toFixed(1)}L</p>
                      </div>
                    </div>

                    <div className="glass rounded-lg p-4">
                      <p className="text-white/60 text-xs mb-3">Exercise</p>
                      <p className="text-2xl font-bold text-white mb-1">{statsData.summary.total_exercise} min</p>
                      <p className="text-white/50 text-xs">Total for this {statsPeriod}</p>
                    </div>

                    <div className="glass rounded-lg p-4">
                      <p className="text-white/60 text-xs mb-3">Daily Progress</p>
                      <div className="space-y-2">
                        {statsData.days.slice(-7).map((day: any) => (
                          <div key={day.date} className="flex items-center gap-2">
                            <span className="text-white/50 text-xs w-20">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-violet-500 h-full rounded-full transition-all"
                                style={{ width: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-white/70 text-xs w-12 text-right">
                              {day.total > 0 ? `${day.completed}/${day.total}` : '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-8">No statistics available</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Main App Component
export default function Home() {
  const [family, setFamily] = useState<{ id: string; name: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [screen, setScreen] = useState<'login' | 'member-select' | 'pin-entry' | 'dashboard' | 'member-detail'>('login')
  const [selectedMember, setSelectedMember] = useState<DashboardMember | null>(null)
  const [settings, setSettings] = useState<FamilySettings | null>(null)

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('token')
    if (token) {
      api.setToken(token)
      api.fetch<Member[]>('/members')
        .then((data) => {
          setMembers(data)
          setScreen('member-select')
        })
        .catch(() => {
          localStorage.removeItem('token')
          api.setToken(null)
        })
    }
  }, [])

  const handleLogin = (familyData: { id: string; name: string }, membersData: Member[]) => {
    setFamily(familyData)
    setMembers(membersData)
    setScreen('member-select')
  }

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member as unknown as DashboardMember)
    setScreen('pin-entry')
  }

  const handlePinVerified = (member: Member) => {
    setCurrentMember(member)
    setScreen('dashboard')
  }

  const handleViewMember = (member: DashboardMember) => {
    setSelectedMember(member)
    setScreen('member-detail')
  }

  const handleLogout = () => {
    setCurrentMember(null)
    setScreen('member-select')
  }

  const handleFullLogout = () => {
    localStorage.removeItem('token')
    api.setToken(null)
    setFamily(null)
    setMembers([])
    setCurrentMember(null)
    setSettings(null)
    setScreen('login')
  }

  const refreshSettings = async () => {
    try {
      const data = await api.fetch<FamilySettings>('/settings')
      setSettings(data)
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const authContextValue: AuthContextType = {
    family,
    members,
    currentMember,
    settings,
    refreshSettings
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <LoginScreen key="login" onLogin={handleLogin} />
        )}
        {screen === 'member-select' && (
          <MemberSelectScreen
            key="member-select"
            members={members}
            onSelect={handleSelectMember}
            onLogout={handleFullLogout}
          />
        )}
        {screen === 'pin-entry' && selectedMember && (
          <PinEntryScreen
            key="pin-entry"
            member={selectedMember as unknown as Member}
            onVerified={handlePinVerified}
            onBack={() => setScreen('member-select')}
          />
        )}
        {screen === 'dashboard' && currentMember && (
          <DashboardScreen
            key="dashboard"
            currentMember={currentMember}
            members={members}
            onViewMember={handleViewMember}
            onLogout={handleLogout}
          />
        )}
        {screen === 'member-detail' && selectedMember && currentMember && (
          <MemberDetailScreen
            key="member-detail"
            member={selectedMember}
            currentMember={currentMember}
            onBack={() => setScreen('dashboard')}
            onUpdate={() => {}}
          />
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  )
}
