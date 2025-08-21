# Date Selection Calendar

A modern, responsive web application built with Next.js that allows users to select multiple dates from a calendar and send them to their email address.

## Features

- 📅 **Dynamic Calendar**: Built with `react-calendar` for smooth date selection
- 🎯 **Multi-Date Selection**: Select any number of dates throughout the year
- 📧 **Email Integration**: Send selected dates directly to your email
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🎨 **Modern UI**: Clean, intuitive interface with Tailwind CSS
- ⚡ **Real-time Updates**: Instant visual feedback for selected dates

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Calendar**: react-calendar
- **Date Handling**: date-fns
- **Email**: nodemailer

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd calendar-date-selector
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

   **Important**: For Gmail, you'll need to use an App Password:
   1. Go to your Google Account settings
   2. Enable 2-factor authentication
   3. Generate an App Password for this application
   4. Use the generated password in `EMAIL_PASS`

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Select Dates**: Click on any dates in the calendar to select them
2. **View Selection**: See all selected dates in the right panel
3. **Remove Dates**: Click "Remove" next to any date or use "Clear All"
4. **Enter Email**: Type your email address in the input field
5. **Submit**: Click "Submit Selected Dates" to send them to your email

## Project Structure

```
├── app/
│   ├── api/
│   │   └── send-email/
│   │       └── route.ts          # Email API endpoint
│   ├── globals.css               # Global styles with Tailwind
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Main calendar page
├── package.json                  # Dependencies and scripts
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## API Endpoints

### POST /api/send-email

Sends selected dates to the specified email address.

**Request Body:**
```json
{
  "email": "user@example.com",
  "dates": ["2024-01-15", "2024-02-20", "2024-03-10"]
}
```

**Response:**
```json
{
  "message": "Email sent successfully"
}
```

## Customization

### Styling
- Modify `app/globals.css` for custom calendar styles
- Update `tailwind.config.js` for theme customization

### Email Template
- Edit the HTML template in `app/api/send-email/route.ts`
- Customize email subject and content

### Calendar Behavior
- Modify date selection logic in `app/page.tsx`
- Add date range selection or other features

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- Set up environment variables
- Build with `npm run build`
- Start with `npm start`

## Troubleshooting

### Email Not Sending
- Verify your email credentials in `.env.local`
- Check if 2-factor authentication is enabled for Gmail
- Ensure you're using an App Password, not your regular password

### Calendar Not Working
- Check browser console for errors
- Verify all dependencies are installed
- Ensure TypeScript compilation is successful

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
