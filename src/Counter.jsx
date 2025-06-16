import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";

const Counter = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-peach-800">Day Counter</h1>
        <p className="text-center text-coral-600 mb-6">
          This is a placeholder for the day counter feature.
        </p>
        <button
          onClick={() => navigate("/home")}
          className="w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-500 text-white hover:bg-peach-600"
          aria-label="Back to home"
        >
          Back to Home
        </button>
      </div>
    </Layout>
  );
};

export default Counter;