import API from "./api";

export const sendSession = async (start, end) => {
  const duration = ((end - start) / 60000).toFixed(2);

  const res = await API.post("/sessions/log", {
    raw: {
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      duration: parseFloat(duration),
    },
  });

  return res.data;
};

export const fetchMySessions = async () => {
  const res = await API.get("/sessions/my");
  return res.data;
};

export const submitFeedback = async (id, isCorrect, state) => {
  await API.post(`/sessions/${id}/feedback`, {
    isCorrect,
    actualState: state,
  });
};