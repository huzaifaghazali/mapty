import { FormField } from './FormField.jsx';

export function WorkoutForm({
  visible,
  type,
  onTypeChange,
  values,
  setValues,
  onSubmit,
  onCancel,
}) {
  const handleCancel = () => {
    // Clear form values
    setValues({
      distance: '',
      duration: '',
      cadence: '',
      elevation: '',
    });

    if (onCancel) onCancel();
  };

  return (
    <form
      className={`bg-dark2 rounded-[5px] px-[2.75rem] py-[1.5rem] mb-[1.75rem] grid grid-cols-2 gap-x-[2.5rem] gap-y-[0.5rem] transition-all duration-500 ${
        visible ? 'h-[13.25rem] opacity-100' : 'form-hidden'
      }`}
      onSubmit={onSubmit}
      aria-hidden={!visible}
    >
      <div className='flex items-baseline'>
        <label
          className='flex-[0_0_50%] text-[1.5rem] font-semibold'
          htmlFor='type'
        >
          Type
        </label>
        <select
          id='type'
          className='w-full px-[1.1rem] py-[0.3rem] text-[1.4rem] text-black border-none rounded-[3px] bg-light3 transition-all duration-200 focus:outline-none focus:bg-white'
          value={type}
          onChange={onTypeChange}
        >
          <option value='running'>Running</option>
          <option value='cycling'>Cycling</option>
        </select>
      </div>

      <FormField
        label='Distance'
        id='distance'
        name='distance'
        value={values.distance}
        onChange={(e) => setValues((v) => ({ ...v, distance: e.target.value }))}
        placeholder='km'
        inputMode='decimal'
      />

      <FormField
        label='Duration'
        id='duration'
        name='duration'
        value={values.duration}
        onChange={(e) => setValues((v) => ({ ...v, duration: e.target.value }))}
        placeholder='min'
        inputMode='numeric'
      />

      <FormField
        label='Cadence'
        id='cadence'
        name='cadence'
        value={values.cadence}
        onChange={(e) => setValues((v) => ({ ...v, cadence: e.target.value }))}
        placeholder='step/min'
        inputMode='numeric'
        hidden={type !== 'running'}
      />

      <FormField
        label='Elev Gain'
        id='elevation'
        name='elevation'
        value={values.elevation}
        onChange={(e) =>
          setValues((v) => ({ ...v, elevation: e.target.value }))
        }
        placeholder='meters'
        inputMode='numeric'
        hidden={type !== 'cycling'}
      />

      <div className='col-span-2 flex justify-end gap-[1rem] mt-[0.5rem]'>
        <button
          type='button'
          className='px-[1.5rem] py-[0.5rem] bg-gray-600 text-white text-[1.4rem] font-medium rounded-[10px] transition-all duration-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500'
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          type='submit'
          className='px-[1.5rem] py-[0.5rem] bg-brand2 text-white text-[1.4rem] font-medium rounded-[10px] transition-all duration-200 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-brand2 focus:ring-opacity-50'
        >
          OK
        </button>
      </div>
    </form>
  );
}