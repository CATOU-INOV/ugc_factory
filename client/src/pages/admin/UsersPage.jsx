// PAGE A5 — Gestion des utilisateurs
// Route : /admin/utilisateurs

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { getUsers, createUser, updateUser } from '../../api/users.js'

const roleLabel = (role) => role === 'ADMIN' ? 'Administrateur' : 'Médiathèque'
const roleBadge = (role) => role === 'ADMIN'
  ? 'bg-orchestra-red-bg text-orchestra-red-dark'
  : 'bg-blue-50 text-blue-700'

// ─── Formulaire d'édition inline ────────────────────────────────────────────
function EditUserRow({ user, onSave, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { firstName: user.firstName, lastName: user.lastName, email: user.email },
  })

  const onSubmit = async (data) => {
    try {
      const updated = await updateUser(user.id, data)
      onSave(updated)
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la mise à jour')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 bg-gray-50 border-b border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="form-label">Prénom *</label>
          <input className="form-input" {...register('firstName', { required: 'Requis' })} />
          {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="form-label">Nom *</label>
          <input className="form-input" {...register('lastName', { required: 'Requis' })} />
          {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>}
        </div>
        <div>
          <label className="form-label">Email *</label>
          <input type="email" className="form-input" {...register('email', { required: 'Requis' })} />
          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm px-4 py-2">
          Annuler
        </button>
        <button type="submit" className="btn-orchestra text-sm px-4 py-2" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onSubmit = async (data) => {
    try {
      const result = await createUser(data)
      setSuccess(
        result.temporaryPassword
          ? `Utilisateur créé. Mot de passe temporaire : ${result.temporaryPassword}`
          : 'Utilisateur créé avec succès.'
      )
      reset()
      load()
      setTimeout(() => setSuccess(''), 8000)
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la création')
    }
  }

  const handleSaved = (updated) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    setEditingId(null)
  }

  return (
    <div className="space-y-8">
      <nav className="text-sm text-gray-500">
        <Link to="/admin" className="hover:text-orchestra-red transition-colors">Accueil</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Utilisateurs</span>
      </nav>

      <h1 className="text-3xl font-display font-black uppercase text-gray-900">Gestion des utilisateurs</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ─── Formulaire création ─────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-display font-bold uppercase text-gray-900 text-lg mb-5">Créer un utilisateur</h2>

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nom *</label>
                <input className="form-input" placeholder="Dupont" {...register('lastName', { required: 'Requis' })} />
                {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
              <div>
                <label className="form-label">Prénom *</label>
                <input className="form-input" placeholder="Marie" {...register('firstName', { required: 'Requis' })} />
                {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" placeholder="utilisateur@orchestra.fr" {...register('email', { required: 'Requis' })} />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Mot de passe</label>
              <input type="password" className="form-input" placeholder="Laisser vide pour un mot de passe temporaire" {...register('password')} />
              <p className="text-xs text-gray-400 mt-1">Si vide, un mot de passe temporaire sera généré et affiché.</p>
            </div>

            <div>
              <label className="form-label">Rôle *</label>
              <select className="form-input" {...register('role', { required: 'Requis' })}>
                <option value="">Sélectionner un rôle...</option>
                <option value="ADMIN">Administrateur</option>
                <option value="MEDIA">Médiathèque (lecture seule)</option>
              </select>
              {errors.role && <p className="text-red-600 text-xs mt-1">{errors.role.message}</p>}
            </div>

            <button type="submit" className="btn-orchestra w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'CRÉER L\'UTILISATEUR'}
            </button>
          </form>
        </div>

        {/* ─── Liste des utilisateurs ──────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-display font-bold uppercase text-gray-900 text-lg">
              Utilisateurs existants
              <span className="ml-2 badge bg-gray-100 text-gray-600">{users.length}</span>
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-4 border-orchestra-red border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map(u => (
                <div key={u.id}>
                  {/* Ligne utilisateur */}
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{u.firstName} {u.lastName}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${roleBadge(u.role)}`}>{roleLabel(u.role)}</span>
                      <button
                        onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-orchestra-red hover:bg-gray-100 transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Formulaire édition inline */}
                  {editingId === u.id && (
                    <EditUserRow
                      user={u}
                      onSave={handleSaved}
                      onCancel={() => setEditingId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
