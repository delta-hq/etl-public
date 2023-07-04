export const createError = (body: any, error: any) => {
  console.log(error);

  return {
    statusCode: 500,
    body: JSON.stringify({
      message: `Request Failed, tried to process: ${JSON.stringify(body)}`,
    }),
  };
};

export const createResponse = (body: any) => ({
  statusCode: 200,
  body: JSON.stringify(body),
});
