'use client'

interface DifficultySelectProps {
  value: string
  onChange: (value: string) => void
}

export default function DifficultySelect({ value, onChange }: DifficultySelectProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('cet4')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          value === 'cet4'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        CET-4 四级
      </button>
      <button
        onClick={() => onChange('cet6')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          value === 'cet6'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        CET-6 六级
      </button>
    </div>
  )
}
