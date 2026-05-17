function errorHandler(err, req, res, next) {
  console.error(`[ERRO] ${req.method} ${req.originalUrl} -`, err.message);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: true,
    message: status === 500
      ? 'Algo deu errado no FERB. Tente novamente em instantes.'
      : err.message,
  });
}
module.exports = errorHandler;
