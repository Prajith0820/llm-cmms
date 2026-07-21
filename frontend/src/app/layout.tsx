import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';

import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import ReactQueryProvider from './ReactQueryProvider';

const theme = createTheme({
  fontFamily: "'Inter', sans-serif",
  primaryColor: 'violet',
  colors: {
    violet: [
      '#f3f0ff', '#e5dbff', '#d0bfff', '#b197fc',
      '#9775fa', '#845ef7', '#7950f2', '#7048e8',
      '#6741d9', '#5f3dc4'
    ]
  },
  defaultRadius: 'md',
  components: {
    Button: { defaultProps: { radius: 'md' } },
    Card:   { defaultProps: { radius: 'lg' } },
    Input:  { defaultProps: { radius: 'md' } },
  }
});

export const metadata: Metadata = {
  title: 'FixByte CMMS',
  description: 'Intelligent Computerized Maintenance Management System powered by AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mantine-color-scheme="dark">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <ModalsProvider>
            <Notifications position="top-right" zIndex={9999} />
            <ReactQueryProvider>
              {children}
            </ReactQueryProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
