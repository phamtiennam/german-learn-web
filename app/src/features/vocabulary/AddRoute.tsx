import { useNavigate, useSearchParams } from 'react-router-dom'
import { addWord } from '../../core/db/schema'
import AddWordDialog, { type DialogInput } from './AddWordDialog'

export default function AddRoute() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const initial: DialogInput = {
    german: params.get('de') ?? params.get('text') ?? '',
    english: params.get('en') ?? '',
    notes: params.get('notes') ?? '',
  }

  const handleSave = async (input: DialogInput) => {
    await addWord(input)
    navigate('/vocabulary', { replace: true })
  }

  const handleCancel = () => {
    navigate('/vocabulary', { replace: true })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-6">
      <h1 className="text-2xl font-semibold text-slate-100">
        Save to vocabulary
      </h1>
      <p className="text-sm text-slate-400">
        Confirm the pair below, then Save. Coming from a share sheet or an iOS
        Shortcut? The text is pre-filled — edit if needed.
      </p>
      <AddWordDialog
        title="Add word"
        saveLabel="Save"
        initial={initial}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}
