import React, { useEffect, useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { handleGoogleLogin, handleSubmit } from './Config';

const Login = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      setFormVisible(true);
    }, 100);
  }, []);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4'>
      <div
        className={`relative bg-white/30 dark:bg-gray-800/90 backdrop-blur-md text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl p-10 max-w-md w-full border border-white/40 dark:border-gray-700 hover:shadow-[0_0_25px_5px_rgba(251,113,133,0.3)] transition duration-300 ${
          formVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-10'
        } transform transition-all duration-500 ease-out`}
      >
        <h2 className='text-3xl font-bold text-center mb-4 text-rose-600 dark:text-rose-400'>Welcome Back</h2>
        <p className='text-gray-700 dark:text-gray-300 text-center mb-6'>Login to your account 🌸</p>

        {error && <p className='text-red-500 text-center mb-4'>{error}</p>}

        <form onSubmit={(e) => handleSubmit(e, setError, navigate)} className='space-y-6'>
          <div>
            <label htmlFor="email" className='block text-gray-800 dark:text-gray-200 font-medium mb-1'>Email Address</label>
            <input
              required
              type="email"
              name='email'
              id='email'
              placeholder='Enter your email'
              className='w-full border-b border-rose-300 dark:border-rose-600 bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1 focus:border-rose-400 dark:focus:border-rose-500 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400'
            />
          </div>

          <div className='relative'>
            <label htmlFor="password" className='block text-gray-800 dark:text-gray-200 font-medium mb-1'>Password</label>
            <input
              type={passwordVisible ? 'text' : 'password'}
              id='password'
              name='password'
              placeholder='Enter your password'
              className='w-full border-b border-rose-300 dark:border-rose-600 bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1 focus:border-rose-400 dark:focus:border-rose-500 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400'
              required
            />
            <button
              type='button'
              onClick={() => setPasswordVisible(!passwordVisible)}
              className='absolute right-2 top-8 text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 focus:outline-none'
            >
              {passwordVisible ? (
                <AiOutlineEyeInvisible className='h-5 w-5' />
              ) : (
                <AiOutlineEye className='h-5 w-5' />
              )}
            </button>
          </div>

          <button
            type='submit'
            className='w-full bg-gradient-to-r from-rose-400 to-pink-400 text-white py-2 rounded-lg hover:from-rose-500 hover:to-pink-500 transition-all duration-300 focus:ring focus:ring-rose-200 focus:outline-none shadow-md hover:shadow-lg'
          >
            Login
          </button>
        </form>

        <div className='mt-8 flex items-center justify-between'>
          <span className='border-b w-1/4 border-rose-200'></span>
          <span className='text-gray-600 dark:text-gray-400 text-sm'>OR</span>
          <span className='border-b w-1/4 border-rose-200'></span>
        </div>

        <button
          onClick={() => handleGoogleLogin(setError, navigate)}
          className='mt-6 w-full flex items-center justify-center bg-white/60 dark:bg-gray-700/60 border border-rose-200 dark:border-rose-700 py-2 rounded-lg shadow-md hover:bg-white/80 dark:hover:bg-gray-700/80 hover:shadow-lg transition-all duration-300 focus:ring focus:ring-rose-200 focus:outline-none text-gray-700 dark:text-gray-200'
        >
          <FcGoogle className='h-6 w-6 mr-3' />
          Continue with Google
        </button>

        <p className='text-center text-gray-700 dark:text-gray-300 text-sm mt-6'>
          Don't have an account?{' '}
          <Link to="/signup" className='text-rose-500 dark:text-rose-400 hover:underline font-medium'>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
