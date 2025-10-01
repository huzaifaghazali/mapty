export function FormField({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  inputMode,
  hidden = false,
}) {
  return (
    <div className={`flex items-baseline ${hidden ? 'hidden' : ''}`}>
      <label
        className='flex-[0_0_50%] text-[1.5rem] font-semibold'
        htmlFor={id}
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className='w-full px-[1.1rem] py-[0.3rem] text-[1.4rem] text-black border-none rounded-[3px] bg-light3 transition-all duration-200 focus:outline-none focus:bg-white'
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        inputMode={inputMode}
      />
    </div>
  );
}
