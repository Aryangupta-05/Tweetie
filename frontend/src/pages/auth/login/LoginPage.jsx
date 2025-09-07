import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import TSvg from "../../../components/svgs/T";
import { MdOutlineMail, MdPassword } from "react-icons/md";

// Use env when provided; otherwise rely on Vite dev proxy with relative path
const BASE_URL = import.meta.env.VITE_API_URL || "";

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    mutate: loginMutation,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ username, password }) => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      // Safely parse the response even if it's empty or not JSON
      const contentType = res.headers.get("content-type") || "";
      let data;
      try {
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          data = text ? JSON.parse(text) : null;
        }
      } catch {
        data = null;
      }

      if (!res.ok) {
        const message =
          (data && (data.error || data.message)) || `Request failed (${res.status})`;
        throw new Error(message);
      }

      return data ?? {};
    },
    onSuccess: (data) => {
      // Immediately update authUser cache
      queryClient.setQueryData(["authUser"], data);

      // Optional: refetch for freshness
      queryClient.invalidateQueries({ queryKey: ["authUser"] });

      // Navigate to home
      navigate("/");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation(formData);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className='max-w-screen-xl mx-auto flex h-screen'>
      <div className='flex-1 hidden lg:flex items-center justify-center'>
        <TSvg className='lg:w-2/3 fill-white' />
      </div>
      <div className='flex-1 flex flex-col justify-center items-center'>
        <form className='flex gap-4 flex-col' onSubmit={handleSubmit}>
          <TSvg className='w-24 lg:hidden fill-white' />
          <h1 className='text-4xl font-extrabold text-white'>{"Let's"} go.</h1>
          <label className='input input-bordered rounded flex items-center gap-2'>
            <MdOutlineMail />
            <input
              type='text'
              className='grow'
              placeholder='Username'
              name='username'
              onChange={handleInputChange}
              value={formData.username}
            />
          </label>
          <label className='input input-bordered rounded flex items-center gap-2'>
            <MdPassword />
            <input
              type='password'
              className='grow'
              placeholder='Password'
              name='password'
              onChange={handleInputChange}
              value={formData.password}
            />
          </label>
          <button className='btn rounded-full btn-primary text-white'>
            {isPending ? "Loading..." : "Login"}
          </button>
          {isError && <p className='text-red-500'>{error.message}</p>}
        </form>
        <div className='flex flex-col gap-2 mt-4'>
          <p className='text-white text-lg'>{"Don't"} have an account?</p>
          <Link to='/signup'>
            <button className='btn rounded-full btn-primary text-white btn-outline w-full'>Sign up</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
