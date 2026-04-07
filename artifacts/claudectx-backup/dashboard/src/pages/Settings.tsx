import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Save, RefreshCw, AlertCircle, CheckCircle, Settings as SettingsIcon } from 'lucide-react'

interface SettingsData {
  apiProvider: 'direct' | 'local-9router' | 'cloud-9router'
  apiKey: string
  baseURL: string
  model: string
  disableSummaries: boolean
}

export default function Settings() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<SettingsData>({
    apiProvider: 'local-9router',
    apiKey: '',
    baseURL: 'http://localhost:20128/v1',
    model: 'claude-opus-4-6',
    disableSummaries: false,
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
  })

  useEffect(() => {
    if (currentSettings) {
      // Detect provider type
      let provider: 'direct' | 'local-9router' | 'cloud-9router' = 'local-9router'
      if (currentSettings.baseURL === 'http://localhost:20128/v1') {
        provider = 'local-9router'
      } else if (currentSettings.baseURL && currentSettings.baseURL.includes('9router')) {
        provider = 'cloud-9router'
      } else if (!currentSettings.baseURL || currentSettings.baseURL === 'https://api.anthropic.com') {
        provider = 'direct'
      }

      setSettings({
        apiProvider: provider,
        apiKey: '', // Don't load masked API key
        baseURL: currentSettings.baseURL || 'http://localhost:20128/v1',
        model: currentSettings.model || 'AWS',
        disableSummaries: currentSettings.disableSummaries || false,
      })
    }
  }, [currentSettings])

  const saveMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      setSaveStatus('success')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['health'] })
      setTimeout(() => setSaveStatus('idle'), 3000)
    },
    onError: () => {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    },
  })

  const handleSave = () => {
    setSaveStatus('saving')

    let finalBaseURL = ''
    let finalApiKey = settings.apiKey

    if (settings.apiProvider === 'local-9router') {
      finalBaseURL = 'http://localhost:20128/v1'
      // Only update API key if user entered something, otherwise keep existing
      if (!settings.apiKey || settings.apiKey.trim() === '') {
        finalApiKey = 'sk_9router' // Default for local 9router
      }
    } else if (settings.apiProvider === 'cloud-9router') {
      finalBaseURL = settings.baseURL
      // Use provided API key (required for cloud)
    } else {
      // Direct Anthropic
      finalBaseURL = ''
    }

    // Only include apiKey in update if user actually entered something
    const updateData: any = {
      baseURL: finalBaseURL,
      model: settings.model,
      disableSummaries: settings.disableSummaries,
    }

    // Only update API key if user entered a value
    if (settings.apiKey && settings.apiKey.trim() !== '') {
      updateData.apiKey = finalApiKey
    }

    saveMutation.mutate(updateData)
  }

  // For 9router: these are combo names, not model names
  // For Direct API: these are actual Claude model names
  const models = [
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6', description: 'Most capable - best for complex analysis' },
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', description: 'Balanced - great speed and quality' },
    { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', description: 'Fastest - good for simple tasks' },
    { value: 'AWS', label: 'AWS', description: '9router combo or Claude Code default' },
    { value: 'custom', label: 'Custom Combo/Model...', description: 'Enter your own combo name or model' },
  ]

  if (isLoading) {
    return (
      <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
        Loading settings...
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <SettingsIcon size={24} color="var(--accent)" />
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Settings</h1>
      </div>

      {/* Split Layout: API Config (Left) and Model/Combo (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* LEFT: API Provider Section */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>API Configuration</h2>

        {/* Provider Type */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text)' }}>
            API Provider
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setSettings({ ...settings, apiProvider: 'local-9router', baseURL: 'http://localhost:20128/v1' })}
              style={{
                padding: '12px 16px',
                background: settings.apiProvider === 'local-9router' ? 'var(--accent)' : 'var(--surface2)',
                color: settings.apiProvider === 'local-9router' ? 'white' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>9router Local (Recommended)</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Running on localhost:20128 - No API key needed
              </div>
            </button>
            <button
              onClick={() => setSettings({ ...settings, apiProvider: 'cloud-9router' })}
              style={{
                padding: '12px 16px',
                background: settings.apiProvider === 'cloud-9router' ? 'var(--accent)' : 'var(--surface2)',
                color: settings.apiProvider === 'cloud-9router' ? 'white' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>9router Cloud</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Remote 9router endpoint - Requires API key only
              </div>
            </button>
            <button
              onClick={() => setSettings({ ...settings, apiProvider: 'direct', baseURL: '' })}
              style={{
                padding: '12px 16px',
                background: settings.apiProvider === 'direct' ? 'var(--accent)' : 'var(--surface2)',
                color: settings.apiProvider === 'direct' ? 'white' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Direct (Anthropic)</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Connect directly to Anthropic's Claude API
              </div>
            </button>
          </div>
        </div>

        {/* API Key - Only for Direct and Cloud 9router */}
        {(settings.apiProvider === 'direct' || settings.apiProvider === 'cloud-9router') && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text)' }}>
              API Key {settings.apiProvider === 'cloud-9router' && <span style={{ color: 'var(--accent)' }}>(Required)</span>}
            </label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder={settings.apiProvider === 'direct' ? 'sk-ant-...' : 'Your 9router API key'}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: 13,
              }}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {settings.apiProvider === 'direct'
                ? 'Get your API key from console.anthropic.com'
                : 'API key provided by your 9router cloud service'
              }
            </div>
          </div>
        )}

        {/* Base URL - Only for Cloud 9router */}
        {settings.apiProvider === 'cloud-9router' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text)' }}>
              Base URL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional - uses default if empty)</span>
            </label>
            <input
              type="text"
              value={settings.baseURL}
              onChange={(e) => setSettings({ ...settings, baseURL: e.target.value })}
              placeholder="https://your-9router-cloud.com/v1"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: 13,
              }}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Leave empty to use default 9router cloud endpoint
            </div>
          </div>
        )}

        {/* Info for Local 9router */}
        {settings.apiProvider === 'local-9router' && (
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--text)' }}>Local 9router:</strong> Using localhost:20128/v1 - No API key needed.
            Make sure 9router is running locally.
          </div>
        )}
      </div>

      {/* RIGHT: Model/Combo Selection */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          {settings.apiProvider === 'direct' ? 'Model Selection' : 'Combo / Model Name'}
        </h2>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text)' }}>
            {settings.apiProvider === 'direct' ? 'Claude Model' : 'Combo Name or Model'}
          </label>
          <select
            value={models.find(m => m.value === settings.model) ? settings.model : 'custom'}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                // Keep current value if it's already custom, otherwise clear
                if (models.find(m => m.value === settings.model)) {
                  setSettings({ ...settings, model: '' })
                }
              } else {
                setSettings({ ...settings, model: e.target.value })
              }
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {models.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>

          {/* Show text input for custom combo/model name */}
          {!models.find(m => m.value === settings.model) && (
            <input
              type="text"
              value={settings.model}
              placeholder={settings.apiProvider === 'direct' ? 'Enter model name (e.g., claude-opus-4-6)' : 'Enter your combo name (e.g., my-fast-combo, production)'}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: 13,
                marginTop: 8,
              }}
            />
          )}

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {settings.apiProvider === 'direct'
              ? models.find(m => m.value === settings.model)?.description || 'Direct Claude API model name'
              : settings.apiProvider === 'local-9router'
              ? '9router combo name (configured in your local 9router settings)'
              : '9router combo name or model identifier'
            }
          </div>
        </div>

        {/* Info box for 9router combos */}
        {settings.apiProvider !== 'direct' && (
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: 20,
          }}>
            <strong style={{ color: 'var(--text)' }}>About 9router Combos:</strong> Combos are custom routing configurations
            you create in 9router. Each combo can route to different models/providers with specific settings.
            Common examples: "AWS", "production-combo", "fast-combo", etc.
          </div>
        )}

        {/* Disable Summaries Toggle */}
        <div style={{ marginBottom: 0 }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}>
            <input
              type="checkbox"
              checked={settings.disableSummaries}
              onChange={(e) => setSettings({ ...settings, disableSummaries: e.target.checked })}
              style={{ cursor: 'pointer' }}
            />
            Disable AI Summaries
          </label>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, marginLeft: 24 }}>
            Turn off automatic session summarization (saves API costs)
          </div>
        </div>
      </div>

    </div>

    {/* Full Width: Info Box and Save Button */}

      {/* Info Box */}
      <div style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
        display: 'flex',
        gap: 12,
      }}>
        <AlertCircle size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>Note:</strong> Changes require a worker restart to take effect.
          After saving, run <code style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: 4 }}>claudectx restart</code> in your terminal.
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          style={{
            padding: '12px 24px',
            background: saveStatus === 'success' ? 'var(--green)' : 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: saveStatus === 'saving' ? 0.6 : 1,
          }}
        >
          {saveStatus === 'saving' && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />}
          {saveStatus === 'success' && <CheckCircle size={16} />}
          {saveStatus === 'idle' && <Save size={16} />}
          {saveStatus === 'error' && <AlertCircle size={16} />}
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Settings'}
        </button>

        {saveStatus === 'error' && (
          <span style={{ fontSize: 13, color: 'var(--red)' }}>
            Failed to save settings. Please try again.
          </span>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
