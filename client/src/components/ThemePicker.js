import React, { useContext } from 'react';
import { ThemeContext } from '../ThemeContext';

export default function ThemePicker() {
  const { theme, setTheme, custom, setCustom } = useContext(ThemeContext);
  return (
    <div className="theme-picker">
      <label>
        <input
          type="radio"
          name="theme"
          value="light"
          checked={theme==='light'}
          onChange={()=>setTheme('light')}
        /> Light
      </label>
      <label>
        <input
          type="radio"
          name="theme"
          value="dark"
          checked={theme==='dark'}
          onChange={()=>setTheme('dark')}
        /> Dark
      </label>
      <label>
        <input
          type="radio"
          name="theme"
          value="custom"
          checked={theme==='custom'}
          onChange={()=>setTheme('custom')}
        /> Custom
      </label>
      {theme==='custom' && (
        <div className="custom-palette">
          <input
            type="color"
            value={custom.primary || '#4CAF50'}
            onChange={e => setCustom(c => ({ ...c, primary: e.target.value }))}
          /> Primary
          <input
            type="color"
            value={custom.accent || '#FFC107'}
            onChange={e => setCustom(c => ({ ...c, accent: e.target.value }))}
          /> Accent
        </div>
      )}
    </div>
  );
}
