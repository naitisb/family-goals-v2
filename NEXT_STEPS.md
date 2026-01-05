# 🚀 Next Steps: Completing Remaining Features

## Quick Implementation Guide

All backend APIs are ready. Here's how to quickly add the remaining frontend features.

---

## 1. Custom Goals UI (30-60 min)

### Location
Edit `src/app/page.tsx` in the `MemberDetailScreen` component.

### What to Add
After the Weekly Goals section, add a "Manage Custom Goals" section:

```typescript
{/* Custom Goals Management */}
<div className="mb-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
      <Target className="w-5 h-5 text-violet-400" />
      Custom Goals
    </h3>
    {isOwnProfile && customGoals.length < 4 && (
      <button
        onClick={() => setShowAddGoalModal(true)}
        className="text-violet-400 text-sm hover:text-violet-300 flex items-center gap-1"
      >
        <Plus className="w-4 h-4" />
        Add Goal
      </button>
    )}
  </div>

  {/* List custom goals with delete button */}
  {customGoals.map(goal => (
    <div key={goal.id} className="glass rounded-xl p-4 mb-3">
      {/* Goal content */}
      <button onClick={() => deleteGoal(goal.id)}>Delete</button>
    </div>
  ))}
</div>
```

### API Calls Needed
- `POST /api/goals` - Create goal
- `PUT /api/goals/[id]` - Edit goal
- `DELETE /api/goals/[id]` - Remove goal

### State to Add
```typescript
const [showAddGoalModal, setShowAddGoalModal] = useState(false)
const [goalTitle, setGoalTitle] = useState('')
const [goalDescription, setGoalDescription] = useState('')
const [goalFrequency, setGoalFrequency] = useState<'daily' | 'weekly'>('daily')
const customGoals = goals.filter(g => g.type === 'custom' && g.is_custom)
```

---

## 2. Water Goal Customization UI (20-30 min)

### Option A: In Settings Modal
Add a new "Goals" tab to the Settings modal:

```typescript
// In SettingsModal component
<div>
  <label>Water Goal Target</label>
  <input
    type="number"
    value={waterTarget}
    onChange={(e) => setWaterTarget(Number(e.target.value))}
  />

  <label>Unit</label>
  <select value={waterUnit} onChange={(e) => setWaterUnit(e.target.value)}>
    <option value="ml">Milliliters (ml)</option>
    <option value="L">Liters (L)</option>
    <option value="oz">Fluid Ounces (oz)</option>
    <option value="cups">Cups</option>
  </select>

  <button onClick={updateWaterGoal}>Save</button>
</div>
```

### Option B: In MemberDetailScreen
Add an edit button next to the water card.

### API Call
```typescript
const updateWaterGoal = async () => {
  // Get water goal ID first
  const waterGoal = goals.find(g => g.type === 'water')
  if (!waterGoal) return

  await api.put(`/goals/${waterGoal.id}`, {
    target_value: waterTarget,
    target_unit: waterUnit
  })
}
```

### Update Water Display
Replace hardcoded `ml` displays with:
```typescript
import { convertMlToUnit, WATER_UNITS } from '@/lib/utils'

const displayValue = convertMlToUnit(waterData.current, waterData.unit)
const displayTarget = convertMlToUnit(waterData.target, waterData.unit)

<p>{displayValue} {waterData.unit} / {displayTarget} {waterData.unit}</p>
```

---

## 3. Goal Timing & Notifications UI (45-60 min)

### Add to Goal Creation/Edit Modal

```typescript
<div>
  <label>Due Time (optional)</label>
  <input
    type="time"
    value={dueTime}
    onChange={(e) => setDueTime(e.target.value)}
  />
</div>

<div className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={reminderEnabled}
    onChange={(e) => setReminderEnabled(e.target.checked)}
  />
  <label>Enable reminder</label>
</div>

{reminderEnabled && (
  <div>
    <label>Reminder Time</label>
    <input
      type="time"
      value={reminderTime}
      onChange={(e) => setReminderTime(e.target.value)}
    />
  </div>
)}
```

### API Call
Already supported in `POST /api/goals` and `PUT /api/goals/[id]`:
```typescript
await api.post('/goals', {
  memberId,
  type: 'custom',
  title,
  description,
  frequency,
  due_time: dueTime || null,
  reminder_enabled: reminderEnabled,
  reminder_time: reminderTime || null
})
```

### Display Goal Time
In goal list:
```typescript
{goal.due_time && (
  <span className="text-white/50 text-xs flex items-center gap-1">
    <Clock className="w-3 h-3" />
    Due: {goal.due_time}
  </span>
)}
```

---

## 4. Photo Albums (60-90 min)

### Add Photo Upload to Profile

In `MemberDetailScreen`, add to profile header:

```typescript
<div className="glass rounded-3xl p-6 mb-6 text-center">
  <div className="relative w-20 h-20 mx-auto mb-4">
    {member.profile_photo_url ? (
      <img
        src={member.profile_photo_url}
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
        onClick={() => uploadProfilePhoto()}
        className="absolute bottom-0 right-0 bg-violet-500 rounded-full p-2"
      >
        <Camera className="w-4 h-4 text-white" />
      </button>
    )}
  </div>
</div>
```

### Photo Upload Handler

```typescript
const uploadProfilePhoto = async () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'profile')
    formData.append('memberId', member.id)

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${api.token}` },
      body: formData
    })

    const data = await response.json()

    // Update member with new photo URL
    await api.put(`/members/${member.id}`, {
      profile_photo_url: data.url
    })

    onUpdate()
  }

  input.click()
}
```

### Goal Photo Albums

Add photo button to each goal:

```typescript
<button
  onClick={() => openGoalPhotos(goal.id)}
  className="text-violet-400 hover:text-violet-300"
>
  <Camera className="w-4 h-4" />
  Photos ({goal.photoCount || 0})
</button>
```

### Photo Gallery Modal

Create a new component:

```typescript
function PhotoGalleryModal({ goalId, onClose }: { goalId: string, onClose: () => void }) {
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    const data = await api.fetch(`/api/photos?goalId=${goalId}`)
    setPhotos(data)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content">
        <h3>Goal Photos</h3>
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <img key={photo.id} src={photo.url} alt="" />
          ))}
        </div>
        <button onClick={uploadPhoto}>Add Photo</button>
      </div>
    </div>
  )
}
```

---

## 5. Statistics View (45-60 min)

### Add Stats Button to Dashboard

```typescript
<button
  onClick={() => setShowStatsModal(true)}
  className="text-white/60 hover:text-white p-2"
>
  <BarChart3 className="w-5 h-5" />
</button>
```

### Stats Modal Component

```typescript
function StatsModal({ memberId, onClose }: { memberId: string, onClose: () => void }) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    const data = await api.fetch(`/api/stats/${period}/${memberId}`)
    setStats(data)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content">
        <h3>Statistics</h3>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setPeriod('week')}>Week</button>
          <button onClick={() => setPeriod('month')}>Month</button>
        </div>

        {stats && (
          <div>
            <p>Average Completion: {stats.summary.avg_completion}%</p>
            <p>Perfect Days: {stats.summary.perfect_days}</p>
            <p>Current Streak: {stats.summary.current_streak}</p>
            <p>Total Water: {stats.summary.total_water}ml</p>
            <p>Total Exercise: {stats.summary.total_exercise}min</p>

            {/* Add chart here using stats.days array */}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 6. Custom Exercises (30-45 min)

### Add to Settings Modal

Add a new "Exercises" tab:

```typescript
{tab === 'exercises' && (
  <div>
    <button onClick={() => setShowAddExercise(true)}>
      Add Custom Exercise
    </button>

    {customExercises.map(exercise => (
      <div key={exercise.id}>
        {exercise.name} - {exercise.default_duration} min
        <button onClick={() => deleteExercise(exercise.id)}>Delete</button>
      </div>
    ))}
  </div>
)}
```

### API Calls

```typescript
// Get custom exercises
const exercises = await api.fetch('/api/exercises/custom')

// Add custom exercise
await api.post('/api/exercises/custom', {
  name: exerciseName,
  default_duration: duration,
  icon: selectedIcon
})

// Delete custom exercise
await api.delete(`/api/exercises/custom/${exerciseId}`)
```

### Use in Exercise Modal

```typescript
<select value={exerciseActivity} onChange={(e) => setExerciseActivity(e.target.value)}>
  {/* Built-in exercises */}
  <option value="Walking">Walking</option>
  <option value="Running">Running</option>

  {/* Custom exercises */}
  {customExercises.map(ex => (
    <option key={ex.id} value={ex.name}>{ex.name}</option>
  ))}
</select>
```

---

## Testing Checklist

After implementing each feature:

### Custom Goals
- [ ] Can add custom goal (daily)
- [ ] Can add custom goal (weekly)
- [ ] Can edit custom goal
- [ ] Can delete custom goal
- [ ] Cannot add more than 4 custom goals per frequency
- [ ] Goals persist after refresh

### Water Customization
- [ ] Can change water target value
- [ ] Can change water unit
- [ ] Display updates to show new unit
- [ ] Water entry still works
- [ ] Progress calculation is correct

### Goal Timing
- [ ] Can set due time
- [ ] Can enable/disable reminders
- [ ] Can set reminder time
- [ ] Times display correctly
- [ ] Settings persist

### Photo Albums
- [ ] Can upload profile photo
- [ ] Profile photo displays correctly
- [ ] Can upload goal photo
- [ ] Can view goal photo gallery
- [ ] Photos persist after refresh

### Statistics
- [ ] Week stats load correctly
- [ ] Month stats load correctly
- [ ] Stats calculations are accurate
- [ ] Charts display properly (if added)

### Custom Exercises
- [ ] Can create custom exercise
- [ ] Custom exercise appears in exercise modal
- [ ] Can delete custom exercise
- [ ] Default duration applies

---

## File Locations

Main files you'll edit:
- `src/app/page.tsx` - All frontend components
- `src/types/index.ts` - TypeScript types (if needed)
- `src/lib/utils.ts` - Utility functions (if needed)

All APIs are already in:
- `src/app/api/` - All API routes ready

---

## Estimated Total Time

- Custom Goals UI: 30-60 min
- Water Customization UI: 20-30 min
- Goal Timing UI: 45-60 min
- Photo Albums: 60-90 min
- Statistics View: 45-60 min
- Custom Exercises: 30-45 min

**Total: ~4-6 hours of focused work** for a complete implementation.

---

## Need Help?

1. Check [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for what's complete
2. Check [FEATURES_IMPLEMENTED.md](FEATURES_IMPLEMENTED.md) for usage guide
3. All API endpoints are documented and working
4. Database schema is ready - no migrations needed

Happy coding! 🚀
