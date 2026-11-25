import { Link } from 'react-router-dom';
import { isOperationsRole, roleLandingPath } from '../../lib/routes';
import { useAuth } from '../../context/AuthContext';

export function HeaderLogo({ isID }: { isID: boolean }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isPublic = !isOperationsRole(user?.role);

  return (
    <Link
      to={roleLandingPath(user?.role)}
      aria-label={isAdmin ? (isID ? 'Roomly Panel Admin' : 'Roomly Admin Panel') : 'Roomly'}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg ${isPublic ? 'max-[375px]:gap-0.5' : ''} ${isAdmin ? 'text-white focus-visible:ring-2 focus-visible:ring-gold-soft' : 'text-[#172953]'}`}
    >
      <svg
        className={`size-8 shrink-0 sm:size-9 ${isAdmin ? 'text-gold-soft' : isPublic ? 'max-[375px]:size-6' : ''}`}
        viewBox="0 0 32 32"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path fillRule="evenodd" d="M5 4h11.2c5.55 0 9.3 3.5 9.3 8.4 0 4.6-3.2 7.9-8 8.45H11V28H5V4Zm6 5.1V16h4.8c2.4 0 3.85-1.3 3.85-3.45S18.2 9.1 15.8 9.1H11ZM22.9 20.8 28 28h-6.9L17 22.8c2.2-.18 4.23-.9 5.9-2Z" />
      </svg>
      <span className="flex flex-col">
        <span className={`font-sans text-[25px] leading-none font-semibold tracking-[-0.035em] sm:text-[29px] ${isPublic ? 'max-[375px]:text-[21px]' : ''}`}>Roomly</span>
        {isAdmin && (
          <span className="mt-0.5 text-[10px] leading-none font-medium text-slate-200">
            {isID ? 'Panel Admin' : 'Admin Panel'}
          </span>
        )}
      </span>
    </Link>
  );
}
