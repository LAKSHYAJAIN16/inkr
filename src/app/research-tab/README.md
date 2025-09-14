# Research Tab

The Research Tab provides a monitored Google search environment for students where all search activities and interactions are tracked and saved.

## Features

- **Google Search Integration**: Full Google search functionality within a controlled iframe
- **Activity Monitoring**: Tracks searches, clicks, navigation, focus events, and time spent
- **Session Management**: Creates and manages research sessions with detailed statistics
- **Real-time Statistics**: Shows live session data including search count, click count, and time spent
- **Activity History**: Displays recent activities with timestamps and activity types
- **Data Persistence**: All activities and sessions are saved to the file system

## Activity Types Tracked

- **Search**: When a student performs a Google search
- **Click**: When a student clicks within the iframe (limited due to cross-origin restrictions)
- **Navigation**: When the iframe loads a new page
- **Focus/Blur**: When the iframe gains or loses focus
- **Scroll**: (Future enhancement - currently limited by iframe sandbox)

## Data Storage

Research data is stored in the `data/research/` directory:
- Each session gets its own folder with ID as the folder name
- `session.json` contains session metadata and statistics
- `activities.json` contains all logged activities for the session
- `sessions.json` contains an index of all sessions

## API Endpoints

- `POST /api/research/activity` - Log a new activity
- `GET /api/research/activity?sessionId=X` - Get activities for a session
- `POST /api/research/session` - Save/update a session
- `GET /api/research/session` - Get all sessions
- `GET /api/research/session?sessionId=X` - Get specific session with activities

## Usage

1. Navigate to `/research-tab` from the main page
2. A new research session automatically starts when the page loads
3. Use the search bar to perform Google searches
4. All activities are automatically tracked and logged
5. View real-time statistics in the session stats panel
6. Click "End Session" to stop monitoring and save the session

## Limitations

Due to browser security restrictions (CORS and iframe sandbox), some monitoring capabilities are limited:
- Cannot track exact click positions within the iframe
- Cannot access iframe content or DOM elements
- Cannot track detailed scroll events within the iframe
- Some Google features may be restricted by the iframe sandbox

## Future Enhancements

- Enhanced scroll tracking
- Screenshot capture capabilities
- More detailed interaction logging
- Export functionality for research data
- Integration with document editor for research notes
