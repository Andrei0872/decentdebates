export const authenticateMiddleware = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res
      .status(401)
      .json({ message: 'No active session!' });
  }
  next();
}