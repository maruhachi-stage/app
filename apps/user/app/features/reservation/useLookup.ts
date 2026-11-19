import { useState } from 'react'
import { useNavigate } from 'react-router'
import { apiFetch, ApiError } from '~/lib/api-client'

export function useLookup() {
    const navigate = useNavigate()
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = code.trim().toUpperCase()
        if (!trimmed) {
            setError('予約番号を入力してください')
            return
        }
        setError('')
        setLoading(true)
        try {
            await apiFetch(`/reservations/${trimmed}`)
            navigate(`/reservations/r/${trimmed}`)
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                setError('予約が見つかりませんでした。予約番号をご確認ください。')
            } else {
                setError('エラーが発生しました。再度お試しください。')
            }
        } finally {
            setLoading(false)
        }
    }

    return { code, setCode, loading, error, handleSubmit }
}
