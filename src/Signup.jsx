import React, { useEffect, useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { handleGoogleLogin, handleSignUp } from './Config';

const Signup = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setFormVisible(true), 100);
  }, []);

  const validatePassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  };

  const handleSignUpWithLoading = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword } = userData;

    if (!firstName || !lastName) {
      setError("Please enter your full name.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must include uppercase, lowercase, number, and at least 8 characters.");
      return;
    }

    setLoading(true);
    const success = await handleSignUp(email, password, firstName, lastName, setError);
setLoading(false);

if (success) {
  navigate("/chat"); //  Redirect after successful signup
}

  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4'>
      <div
        className={`relative bg-white/30 dark:bg-gray-800/90 backdrop-blur-md text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl p-10 max-w-md w-full border border-white/40 dark:border-gray-700 hover:shadow-[0_0_25px_5px_rgba(251,113,133,0.3)] transition duration-300 ${formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'} transform transition-all duration-500 ease-out`}
      >
        <h2 className='text-3xl font-bold text-center mb-4 text-rose-600 dark:text-rose-400'>Create Account</h2>
        <p className='text-gray-700 dark:text-gray-300 text-center mb-6'>Join us and take charge of your menstrual health 💫</p>

        {error && <p className='text-red-500 text-center mb-4'>{error}</p>}

        <form onSubmit={handleSignUpWithLoading} className='space-y-5'>
          {/* Full name fields */}
          <div className='flex gap-3'>
            <div className='w-1/2'>
              <label className='block text-gray-800 dark:text-gray-200 font-medium mb-1'>First Name</label>
              <input
                type="text"
                placeholder='First name'
                value={userData.firstName}
                onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                required
                className='w-full border-b border-rose-300 dark:border-rose-600 bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1 focus:border-rose-400 dark:focus:border-rose-500 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400'
              />
            </div>
            <div className='w-1/2'>
              <label className='block text-gray-800 dark:text-gray-200 font-medium mb-1'>Last Name</label>
              <input
                type="text"
                placeholder='Last name'
                value={userData.lastName}
                onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                required
                className='w-full border-b border-rose-300 dark:border-rose-600 bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1 focus:border-rose-400 dark:focus:border-rose-500 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400'
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className='block text-gray-800 dark:text-gray-200 font-medium mb-1'>Email Address</label>
            <input
              required
              type="email"
              placeholder='Enter your email'
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              className='w-full border-b border-pink-400 dark:border-pink-600 bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1 focus:border-pink-600 dark:focus:border-pink-500 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400'
            />
          </div>

          {/* Password */}
          <div className='relative'>
            <label className='block text-gray-800 dark:text-gray-200 font-medium mb-1'>Password</label>
            <input
              type={passwordVisible ? 'text' : 'password'}
              placeholder='Enter your password'
              value={userData.password}
              onChange={(e) => setUserData({ ...userData, password: e.target.value })}
              className='w-full border-b border-pink-400 dark:border-pink-600 bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1 focus:border-pink-600 dark:focus:border-pink-500 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400'
              required
            />
            <button
              type='button'
              onClick={() => setPasswordVisible(!passwordVisible)}
              className='absolute right-2 top-8 text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 focus:outline-none'
            >
              {passwordVisible ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </button>

            {/* Live password requirement check */}
            <div className="text-sm mt-2 space-y-1 bg-white/50 dark:bg-gray-700/50 rounded-md p-2">
              <p className="font-medium text-gray-700 dark:text-gray-300">Password must include:</p>
              <ul className="text-gray-700 dark:text-gray-300 list-disc pl-5">
                <li className={userData.password.length >= 8 ? "text-green-600" : ""}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(userData.password) ? "text-green-600" : ""}>
                  One uppercase letter
                </li>
                <li className={/[a-z]/.test(userData.password) ? "text-green-600" : ""}>
                  One lowercase letter
                </li>
                <li className={/[0-9]/.test(userData.password) ? "text-green-600" : ""}>
                  One number
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm password */}
          <div className='relative'>
            <label className='block text-gray-800 dark:text-gray-200 font-medium mb-1'>Confirm Password</label>
            <input
              type={confirmVisible ? 'text' : 'password'}
              placeholder='Re-enter your password'
              value={userData.confirmPassword}
              onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
              className='w-full border-b border-pink-400 dark:border-pink-600 bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1 focus:border-pink-600 dark:focus:border-pink-500 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400'
              required
            />
            <button
              type='button'
              onClick={() => setConfirmVisible(!confirmVisible)}
              className='absolute right-2 top-8 text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 focus:outline-none'
            >
              {confirmVisible ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </button>
          </div>

          {/* Sign up button */}
          <button
            type='submit'
            disabled={loading}
            className={`w-full ${loading
              ? 'bg-rose-300'
              : 'bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500'
              } text-white py-2 rounded-lg transition-all duration-300 focus:ring focus:ring-rose-200 focus:outline-none shadow-md hover:shadow-lg`}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* OR divider */}
        <div className='mt-8 flex items-center justify-between'>
          <span className='border-b w-1/4 border-rose-200'></span>
          <span className='text-gray-600 dark:text-gray-400 text-sm'>OR</span>
          <span className='border-b w-1/4 border-rose-200'></span>
        </div>

        {/* Google sign-up */}
        <button
          onClick={() => handleGoogleLogin(setError, navigate)}
          className='mt-6 w-full flex items-center justify-center bg-white/60 dark:bg-gray-700/60 border border-rose-200 dark:border-rose-700 py-2 rounded-lg shadow-md hover:bg-white/80 dark:hover:bg-gray-700/80 hover:shadow-lg transition-all duration-300 focus:ring focus:ring-rose-200 focus:outline-none text-gray-700 dark:text-gray-200'
        >
          <FcGoogle className='h-6 w-6 mr-3' />
          Sign up with Google
        </button>

        {/* Link to login */}
        <p className='text-center text-gray-700 dark:text-gray-300 text-sm mt-6'>
          Already have an account?{' '}
          <Link to="/login" className='text-rose-500 dark:text-rose-400 hover:underline font-medium'>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
