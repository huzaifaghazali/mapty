export function Sidebar({ children }) {
  return (
    <aside className='flex-[0_0_50rem] bg-dark1 px-[5rem] py-[3rem] pb-[4rem] flex flex-col'>
      {children}
    </aside>
  );
}
