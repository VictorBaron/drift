import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/common/services/api';
import type { Step1Data, Step2Data, Step3Data } from '@/features/onboarding';
import { Step1ProjectInfo, Step2ConnectSources, Step3ProductObjective, StepIndicator } from '@/features/onboarding';
import { S } from '@/features/onboarding/styles';

export function OnboardingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const step = Number(searchParams.get('step') ?? '1');

  const [step1, setStep1] = useState<Step1Data>({
    name: '',
    emoji: '🚀',
    pmLeadName: '',
    techLeadName: '',
    teamName: '',
    targetDate: '',
  });

  const [step2, setStep2] = useState<Step2Data>({
    slackChannelIds: [],
    linearTeamId: '',
    linearProjectId: '',
    notionPageId: '',
    notionTitle: null,
  });

  const [step3, setStep3] = useState<Step3Data>({
    productObjective: '',
    keyResults: [],
    objectiveOrigin: 'manual',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToStep = (n: number) => setSearchParams({ step: String(n) });

  const handleNext = () => {
    if (step === 1 && !step1.name.trim()) {
      setError('Project name is required');
      return;
    }
    setError(null);
    goToStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!step3.productObjective.trim()) {
      setError('Product objective is required');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await api.createProject({
        name: step1.name,
        emoji: step1.emoji,
        pmLeadName: step1.pmLeadName || null,
        techLeadName: step1.techLeadName || null,
        teamName: step1.teamName || null,
        targetDate: step1.targetDate || null,
        slackChannelIds: step2.slackChannelIds,
        linearProjectId: step2.linearProjectId || null,
        linearTeamId: step2.linearTeamId || null,
        notionPageId: step2.notionPageId || null,
        productObjective: step3.productObjective,
        objectiveOrigin: step3.objectiveOrigin,
        keyResults: step3.keyResults.filter((kr) => kr.text.trim()),
      });
      navigate('/dashboard?onboarding=done');
    } catch {
      setError('Failed to create project. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={S.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Newsreader:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div style={S.nav}>
        <span style={S.logo}>
          pulse<span style={S.accent}>.</span>
        </span>
        <span style={{ fontSize: 12, color: '#666' }}>Setup · Step {step} of 3</span>
      </div>

      <div style={S.container}>
        <div style={S.card}>
          <StepIndicator current={step} total={3} />

          {step === 1 && <Step1ProjectInfo data={step1} onChange={setStep1} />}
          {step === 2 && <Step2ConnectSources data={step2} onChange={setStep2} />}
          {step === 3 && (
            <Step3ProductObjective
              data={step3}
              onChange={setStep3}
              hasNotion={!!step2.notionPageId}
              notionPageId={step2.notionPageId}
            />
          )}

          {error && (
            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: '#FFEBEE',
                border: '1px solid #FFCDD2',
                color: '#C62828',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid #F0EEED',
            }}
          >
            <div>
              {step > 1 && (
                <button style={S.btnSecondary} onClick={() => goToStep(step - 1)}>
                  ← Back
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {step < 3 && (
                <button style={{ ...S.btnSecondary, fontSize: 13 }} onClick={() => goToStep(step + 1)}>
                  Skip
                </button>
              )}
              {step < 3 ? (
                <button style={S.btnPrimary} onClick={handleNext}>
                  Next →
                </button>
              ) : (
                <button style={S.btnPrimary} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create project →'}
                </button>
              )}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#A09B94', marginTop: 20 }}>
          You can always edit these settings later from the dashboard.
        </p>
      </div>
    </div>
  );
}
