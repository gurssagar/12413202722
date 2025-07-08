"use client"
import { useState, useEffect } from "react";
import type { Theme } from "@mui/material/styles";
import { logger } from "../lib/logging";
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Link,
  TextField,
  Button,
  Typography
} from "@mui/material";
import Image from "next/image";


export default function Page() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    logger.info('component', 'Page loaded');
  }, []);

  const fetchUrl = async() => {
      if (!url || typeof url !== 'string') {
        logger.error('component', 'URL is required and must be a string');
        return;
      }
  
      try {
        const response = await fetch('http://localhost:3001/shorturls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "url": url,
            "validity": 30
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to shorten URL');
        }
        
        const data = await response.json();
        logger.info('api', 'URL shortened successfully', {
          originalUrl: url,
          shortUrl: data.shortenedUrl
        });
        setShortUrl(data.shortenedUrl);
      } catch (error) {
        logger.error('api', 'Failed to shorten URL', {
          error: error instanceof Error ? error.message : String(error),
          url
        });
      }
    }
  logger.debug('component', 'Current short URL state', { shortUrl });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchUrl();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    logger.info('component', 'URL copied to clipboard', { shortUrl });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)]">
      <AppBar position="static" sx={{ mb: 4, backgroundColor: 'black' }}>
        <Container maxWidth="md">
          <Toolbar>
            <Image src="/logo.png" alt="Logo" width={120} height={40} />
            <Link href="/" color="inherit" underline="none" sx={{ mx: 2 }}>
              Home
            </Link>
            <Link href="/about" color="inherit" underline="none">
              About
            </Link>
          </Toolbar>
        </Container>
      </AppBar>

      <main className="flex flex-col gap-[32px] items-center sm:items-start w-full px-8 sm:px-20" style={{ minHeight: 'calc(100vh - 40vh)', maxWidth: '1000px', margin: '0 auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          URL Shortener
        </Typography>
        <Typography variant="body1" paragraph>
          Quickly shorten any URL and share it with others. Links expire after 30 minutes.
        </Typography>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '16px', width: '100%' , paddingTop:"10px"}}>
          <TextField
            label="Enter URL to shorten"
            variant="outlined"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            sx={{
              width: '75%',
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                fontFamily: "Arial",
                fontWeight: "bold",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#fff",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-outlined": {
                color: "#fff",
                fontWeight: "bold",
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{
              width: '25%',
              py: 1.5,
              height: '56px' // Match TextField height
            }}
          >
            Shorten URL
          </Button>
        </form>

        {shortUrl && (
          <div className="w-full space-y-2" style={{ paddingTop:"20px" }}>
            <div style={{ display: 'flex', gap: '16px', width: '100%',paddingTop:"5px" }}>
              <TextField
                label="Shortened URL"
                variant="outlined"
                value={shortUrl}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
              width: '87.5%',
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                fontFamily: "Arial",
                fontWeight: "bold",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#fff",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-outlined": {
                color: "#fff",
                fontWeight: "bold",
              },
            }}
              />
              <Button
                variant="outlined"
                onClick={handleCopy}
                sx={{
                  width: '12.5%',
                  height: '56px' // Match TextField height
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        )}
      </main>

      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme: Theme) => theme.palette.grey[200] }}>
        <Container maxWidth="md">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} URL Shortener App
          </Typography>
        </Container>
      </Box>
    </div>
  );
}
