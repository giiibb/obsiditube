import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'YouTube to Obsidian';
    const subtitle = searchParams.get('subtitle') || 'Distill Your Digital Stream';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0a0a0a 100%)',
            padding: '40px',
          }}
        >
          {/* Subtle Background Text */}
          <div
            style={{
              position: 'absolute',
              top: -50,
              left: -50,
              fontSize: 200,
              fontWeight: 900,
              color: 'rgba(200, 100, 60, 0.03)',
              userSelect: 'none',
            }}
          >
            OBSIDITUBE
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '40px',
              padding: '60px 80px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Logo area */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
              <div 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '15px', 
                  backgroundColor: '#c8643c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '20px'
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" />
                </svg>
              </div>
              <span style={{ fontSize: 60, fontWeight: 900, color: 'white', letterSpacing: '-0.05em' }}>
                Obsidi<span style={{ color: '#c8643c' }}>Tube</span>
              </span>
            </div>

            <h1
              style={{
                fontSize: 70,
                fontWeight: 900,
                color: 'white',
                textAlign: 'center',
                marginBottom: '20px',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>
            
            <p
              style={{
                fontSize: 28,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
              }}
            >
              {subtitle}
            </p>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 40,
              fontSize: 20,
              color: 'rgba(255, 255, 255, 0.3)',
              fontWeight: 600,
            }}
          >
            obsiditube.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
