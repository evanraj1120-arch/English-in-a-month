import { useState } from 'react';
import type { PracticeProgressState } from './progress';

export function ProgressProfileControls({ progress, disabled = false }: { progress: PracticeProgressState; disabled?: boolean }) {
  const [newName, setNewName] = useState('');
  const profile = progress.profile;
  if (!profile) return null;
  return (
    <section className="profile-controls" aria-label="Local progress profile">
      <div>
        <label htmlFor="active-profile">Current local profile</label>
        <select id="active-profile" value={profile.name} disabled={disabled} onChange={(event) => progress.switchProfile(event.target.value)}>
          {progress.profileNames.map((name) => <option key={name}>{name}</option>)}
        </select>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); progress.switchProfile(newName); setNewName(''); }}>
        <label htmlFor="new-profile">Create or switch to another profile</label>
        <div className="inline-form">
          <input id="new-profile" value={newName} maxLength={32} disabled={disabled} onChange={(event) => setNewName(event.target.value)} placeholder="Choose a name" />
          <button type="submit" className="secondary-button" disabled={disabled || !newName.trim()}>Use profile</button>
        </div>
      </form>
      <p className="local-privacy-note">Progress stays in this browser, not in an account. Profiles are labels, not passwords: anyone using this browser can switch to or view another profile. Use a distinct name to keep histories from overwriting one another.</p>
      {disabled && <p className="local-privacy-note">Profile switching is disabled until this practice session is closed so its attempts stay with the selected profile.</p>}
      {progress.storageError && (
        <div className="storage-warning" role="alert">
          <p>{progress.storageError}</p>
          {progress.canResetStorage && <button type="button" className="secondary-button" onClick={() => {
            if (window.confirm('Reset this app’s unreadable local progress data? This removes the saved practice history stored by this app in this browser.')) progress.resetUnreadableProgress();
          }}>Reset unreadable local progress</button>}
        </div>
      )}
    </section>
  );
}
