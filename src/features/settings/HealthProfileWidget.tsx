'use client'

import { useState, useEffect } from 'react'
import { Heart, Activity, AlertCircle, Plus, X, Save, Eye, EyeOff } from 'lucide-react'
import {
  getHealthProfile,
  saveHealthProfile,
  deleteHealthProfile,
  getPartnerHealthProfile,
  calculateBMI,
  getBMICategory,
  BLOOD_TYPES,
  type HealthProfile,
  type HealthProfileInput,
} from '@/lib/healthProfile'

export default function HealthProfileWidget() {
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<HealthProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPartnerData, setShowPartnerData] = useState(false)

  // Form state
  const [bloodType, setBloodType] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medications, setMedications] = useState('')
  const [conditions, setConditions] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyRelationship, setEmergencyRelationship] = useState('')

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      const myProfile = await getHealthProfile()
      setProfile(myProfile)

      if (myProfile) {
        setBloodType(myProfile.blood_type || '')
        setHeight(myProfile.height_cm?.toString() || '')
        setWeight(myProfile.weight_kg?.toString() || '')
        setAllergies(myProfile.allergies?.join(', ') || '')
        setMedications(myProfile.medications?.join(', ') || '')
        setConditions(myProfile.conditions?.join(', ') || '')
        setEmergencyName(myProfile.emergency_contact?.name || '')
        setEmergencyPhone(myProfile.emergency_contact?.phone || '')
        setEmergencyRelationship(myProfile.emergency_contact?.relationship || '')
      }

      const partner = await getPartnerHealthProfile()
      setPartnerProfile(partner)
    } catch (err) {
      setError('Failed to load health profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setError(null)
      const data: HealthProfileInput = {}

      if (bloodType) data.blood_type = bloodType
      if (height) data.height_cm = parseInt(height)
      if (weight) data.weight_kg = parseFloat(weight)
      if (allergies) data.allergies = allergies.split(',').map(a => a.trim()).filter(Boolean)
      if (medications) data.medications = medications.split(',').map(m => m.trim()).filter(Boolean)
      if (conditions) data.conditions = conditions.split(',').map(c => c.trim()).filter(Boolean)
      if (emergencyName || emergencyPhone || emergencyRelationship) {
        data.emergency_contact = {
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRelationship,
        }
      }

      await saveHealthProfile(data)
      setSuccess('Health profile saved successfully!')
      setEditing(false)
      await loadProfiles()
    } catch (err: any) {
      setError(err.message || 'Failed to save health profile')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your health profile? This cannot be undone.')) {
      return
    }

    try {
      setError(null)
      await deleteHealthProfile()
      setSuccess('Health profile deleted')
      setProfile(null)
      setEditing(false)
      // Reset form
      setBloodType('')
      setHeight('')
      setWeight('')
      setAllergies('')
      setMedications('')
      setConditions('')
      setEmergencyName('')
      setEmergencyPhone('')
      setEmergencyRelationship('')
    } catch (err: any) {
      setError(err.message || 'Failed to delete health profile')
    }
  }

  const handleCancel = () => {
    setEditing(false)
    if (profile) {
      setBloodType(profile.blood_type || '')
      setHeight(profile.height_cm?.toString() || '')
      setWeight(profile.weight_kg?.toString() || '')
      setAllergies(profile.allergies?.join(', ') || '')
      setMedications(profile.medications?.join(', ') || '')
      setConditions(profile.conditions?.join(', ') || '')
      setEmergencyName(profile.emergency_contact?.name || '')
      setEmergencyPhone(profile.emergency_contact?.phone || '')
      setEmergencyRelationship(profile.emergency_contact?.relationship || '')
    }
  }

  const bmi = height && weight ? calculateBMI(parseInt(height), parseFloat(weight)) : null
  const bmiCategory = bmi ? getBMICategory(bmi) : null

  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="animate-pulse">
          <div className="h-5 w-1/3 rounded bg-[var(--accent-1)]/10" />
          <div className="mt-4 h-20 rounded bg-[var(--accent-1)]/10" />
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-[var(--accent-1)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Health Profile</h3>
        </div>
        {profile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl bg-green-500/10 p-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {!editing && profile ? (
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            {profile.blood_type && (
              <div className="rounded-xl bg-[var(--bg-2)] p-3">
                <p className="text-xs text-[var(--text-secondary)]">Blood Type</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{profile.blood_type}</p>
              </div>
            )}
            {bmi && (
              <div className="rounded-xl bg-[var(--bg-2)] p-3">
                <p className="text-xs text-[var(--text-secondary)]">BMI</p>
                <p className={`text-sm font-medium ${bmiCategory?.color || 'text-[var(--text-primary)]'}`}>
                  {bmi} ({bmiCategory?.category})
                </p>
              </div>
            )}
            {profile.height_cm && (
              <div className="rounded-xl bg-[var(--bg-2)] p-3">
                <p className="text-xs text-[var(--text-secondary)]">Height</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{profile.height_cm} cm</p>
              </div>
            )}
            {profile.weight_kg && (
              <div className="rounded-xl bg-[var(--bg-2)] p-3">
                <p className="text-xs text-[var(--text-secondary)]">Weight</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{profile.weight_kg} kg</p>
              </div>
            )}
          </div>

          {/* Medical Info */}
          {(profile.allergies?.length || profile.medications?.length || profile.conditions?.length) && (
            <div className="space-y-2">
              {profile.allergies?.length && (
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Allergies</p>
                  <p className="text-sm text-[var(--text-primary)]">{profile.allergies.join(', ')}</p>
                </div>
              )}
              {profile.medications?.length && (
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Medications</p>
                  <p className="text-sm text-[var(--text-primary)]">{profile.medications.join(', ')}</p>
                </div>
              )}
              {profile.conditions?.length && (
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Conditions</p>
                  <p className="text-sm text-[var(--text-primary)]">{profile.conditions.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Emergency Contact */}
          {profile.emergency_contact?.name && (
            <div className="rounded-xl bg-[var(--bg-2)] p-3">
              <p className="text-xs text-[var(--text-secondary)]">Emergency Contact</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{profile.emergency_contact.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{profile.emergency_contact.phone}</p>
              <p className="text-xs text-[var(--text-secondary)]">{profile.emergency_contact.relationship}</p>
            </div>
          )}

          {/* Partner Profile */}
          {partnerProfile && (
            <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] p-3">
              <button
                onClick={() => setShowPartnerData(!showPartnerData)}
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"
              >
                {showPartnerData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPartnerData ? 'Hide' : 'View'} Partner&apos;s Profile
              </button>
              {showPartnerData && (
                <div className="mt-3 space-y-2 text-sm">
                  {partnerProfile.blood_type && (
                    <div>
                      <span className="text-[var(--text-secondary)]">Blood Type: </span>
                      <span className="text-[var(--text-primary)]">{partnerProfile.blood_type}</span>
                    </div>
                  )}
                  {partnerProfile.allergies?.length && (
                    <div>
                      <span className="text-[var(--text-secondary)]">Allergies: </span>
                      <span className="text-[var(--text-primary)]">{partnerProfile.allergies.join(', ')}</span>
                    </div>
                  )}
                  {partnerProfile.emergency_contact?.name && (
                    <div>
                      <span className="text-[var(--text-secondary)]">Emergency: </span>
                      <span className="text-[var(--text-primary)]">{partnerProfile.emergency_contact.name} ({partnerProfile.emergency_contact.phone})</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleDelete}
            className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
          >
            Delete Profile
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {!editing ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-3 text-[var(--accent-1)]/50" />
              <p className="text-sm text-[var(--text-secondary)]">
                No health profile yet. Add your health information for emergency reference.
              </p>
              <button
                onClick={() => setEditing(true)}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]"
              >
                <Plus className="h-4 w-4" />
                Add Profile
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-3">
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Blood Type</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <option value="">Select</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value}>
                      {bt.label} ({bt.labelMM})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[var(--text-secondary)]">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)]">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="65"
                    className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {bmi && bmiCategory && (
                <div className="rounded-xl bg-[var(--bg-2)] p-3">
                  <p className="text-xs text-[var(--text-secondary)]">Calculated BMI</p>
                  <p className={`text-sm font-medium ${bmiCategory.color}`}>
                    {bmi} ({bmiCategory.category})
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm text-[var(--text-secondary)]">Allergies (comma-separated)</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Peanuts, Shellfish"
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">Medications (comma-separated)</label>
                <input
                  type="text"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="Aspirin, Insulin"
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">Conditions (comma-separated)</label>
                <input
                  type="text"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="Diabetes, Asthma"
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] p-3">
                <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Emergency Contact</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Name"
                    className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                  />
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Phone"
                    className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                  />
                  <input
                    type="text"
                    value={emergencyRelationship}
                    onChange={(e) => setEmergencyRelationship(e.target.value)}
                    placeholder="Relationship (e.g., Spouse, Parent)"
                    className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--button-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
