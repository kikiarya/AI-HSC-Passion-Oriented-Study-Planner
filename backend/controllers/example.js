// Example controller
export const getExample = (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Example controller response'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

