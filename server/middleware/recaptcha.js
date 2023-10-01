const axios = require('axios');

// Middleware function for reCAPTCHA validation
const validateRecaptcha = async (req, res, next) => {
    const secretKey = 'YOUR_SECRET_KEY_HERE'; // Your reCAPTCHA secret key
    const recaptchaResponse = req.body['g-recaptcha-response'];

    try {
        const response = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            undefined,
            {
                params: {
                    secret: secretKey,
                    response: recaptchaResponse,
                },
            }
        );

        const data = response.data;

        if (data.success) {
            res.render("/verify", { error: null });

        } else {
            res.render("layout/2fa", { error: 'Enter reCAPTCHA ', email: req?.session?.user?.email });
        }
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        res.status(500).send('Internal server error');
    }
};

module.exports = validateRecaptcha;
