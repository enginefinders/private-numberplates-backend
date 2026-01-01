import { usePlateStore } from '../stores/plateStore';

export default function plateBuilder() {
  const { plateConfig, setPlateConfig, resetPlateConfig } = usePlateStore();

  return (
    <div>
      <input
        type="text"
        value={plateConfig.text}
        placeholder="Enter plate text"
        onChange={(e) => setPlateConfig({ text: e.target.value })}
      />

      <select
        value={plateConfig.font}
        onChange={(e) => setPlateConfig({ font: e.target.value })}
      >
        <option value="UK-Regular">UK-Regular</option>
        <option value="UK-Bold">UK-Bold</option>
        <option value="UK-Italic">UK-Italic</option>
      </select>

      <button onClick={resetPlateConfig}>Reset Plate</button>

      <pre>{JSON.stringify(plateConfig, null, 2)}</pre>
    </div>
  );
}
