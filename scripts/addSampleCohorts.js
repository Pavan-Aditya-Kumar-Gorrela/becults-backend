import Cohort from '../models/Cohort.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const addSampleCohorts = async () => {
  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Find or create an admin user
    let adminUser = await User.findOne({ isAdmin: true });
    
    if (!adminUser) {
      adminUser = await User.create({
        fullName: 'Admin User',
        email: 'admin@becults.com',
        password: 'hashedpassword123',
        isAdmin: true,
      });
      console.log('Created admin user');
    }

    // Sample cohorts with roadmap and videos
    const sampleCohorts = [
      {
        title: 'React Fundamentals Bootcamp',
        description: 'Learn React from scratch with modern hooks, state management, and component patterns. Perfect for beginners.',
        category: 'React',
        createdBy: adminUser._id,
        isActive: true,
        enrolledUsers: [],
        roadmap: [
          {
            title: 'React Basics & JSX',
            description: 'Understand React components, JSX syntax, props, and how React renders to the DOM.',
            order: 1,
          },
          {
            title: 'State & Lifecycle',
            description: 'Learn about component state, lifecycle methods, and useEffect hook for side effects.',
            order: 2,
          },
          {
            title: 'Hooks Deep Dive',
            description: 'Master useState, useContext, useReducer, and custom hooks patterns.',
            order: 3,
          },
          {
            title: 'Routing & Navigation',
            description: 'Implement client-side routing with React Router for multi-page applications.',
            order: 4,
          },
          {
            title: 'State Management',
            description: 'Explore Redux, Context API, and modern state management solutions.',
            order: 5,
          },
        ],
        videos: [
          {
            title: 'Introduction to React',
            videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
            duration: '45:30',
            order: 1,
          },
          {
            title: 'React Hooks Tutorial',
            videoUrl: 'https://www.youtube.com/watch?v=f687hBjwFcM',
            duration: '38:20',
            order: 2,
          },
          {
            title: 'React Router Tutorial',
            videoUrl: 'https://www.youtube.com/watch?v=Law7UprIJTQ',
            duration: '42:15',
            order: 3,
          },
        ],
      },
      {
        title: 'Web Development with MERN Stack',
        description: 'Build full-stack applications using MongoDB, Express, React, and Node.js. Includes authentication and deployment.',
        category: 'Web Development',
        createdBy: adminUser._id,
        isActive: true,
        enrolledUsers: [],
        roadmap: [
          {
            title: 'Node.js & Express Basics',
            description: 'Set up Express server, create routes, and understand middleware.',
            order: 1,
          },
          {
            title: 'Database Design with MongoDB',
            description: 'Model data, create schemas with Mongoose, and perform CRUD operations.',
            order: 2,
          },
          {
            title: 'Authentication & Authorization',
            description: 'Implement JWT-based authentication and role-based access control.',
            order: 3,
          },
          {
            title: 'RESTful API Development',
            description: 'Design scalable APIs, handle errors, and follow REST conventions.',
            order: 4,
          },
          {
            title: 'Frontend Integration',
            description: 'Connect React frontend with backend APIs, manage state, and handle real-time updates.',
            order: 5,
          },
        ],
        videos: [
          {
            title: 'Node.js Crash Course',
            videoUrl: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4',
            duration: '40:45',
            order: 1,
          },
          {
            title: 'MongoDB & Mongoose Guide',
            videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
            duration: '35:20',
            order: 2,
          },
          {
            title: 'MERN Stack Project',
            videoUrl: 'https://www.youtube.com/watch?v=98BzS5Oz5E4',
            duration: '52:10',
            order: 3,
          },
        ],
      },
      {
        title: 'JavaScript Advanced Concepts',
        description: 'Deep dive into closures, prototypes, async programming, and ES6+ features.',
        category: 'JavaScript',
        createdBy: adminUser._id,
        isActive: true,
        enrolledUsers: [],
        roadmap: [
          {
            title: 'Scope & Closures',
            description: 'Understand lexical scoping, closures, and how JavaScript manages variables.',
            order: 1,
          },
          {
            title: 'Prototypes & Inheritance',
            description: 'Learn prototype-based inheritance, constructor functions, and classes.',
            order: 2,
          },
          {
            title: 'Async JavaScript',
            description: 'Master callbacks, promises, async/await, and event loop.',
            order: 3,
          },
          {
            title: 'ES6+ Features',
            description: 'Explore arrow functions, destructuring, spread operator, and modern syntax.',
            order: 4,
          },
        ],
        videos: [
          {
            title: 'JavaScript Closures Explained',
            videoUrl: 'https://www.youtube.com/watch?v=rQIGLzDQRJ4',
            duration: '20:45',
            order: 1,
          },
          {
            title: 'Promises and Async Await',
            videoUrl: 'https://www.youtube.com/watch?v=li7FzDHYZpc',
            duration: '33:15',
            order: 2,
          },
          {
            title: 'ES6 Deep Dive',
            videoUrl: 'https://www.youtube.com/watch?v=ZJEatoHeQxc',
            duration: '42:30',
            order: 3,
          },
        ],
      },
    ];

    // Clear existing cohorts (optional - comment out if you want to keep existing ones)
    // await Cohort.deleteMany({});

    // Add cohorts if they don't exist
    for (const cohortData of sampleCohorts) {
      const exists = await Cohort.findOne({ title: cohortData.title });
      if (!exists) {
        await Cohort.create(cohortData);
        console.log(`✅ Created cohort: ${cohortData.title}`);
      } else {
        console.log(`⏭️  Cohort already exists: ${cohortData.title}`);
      }
    }

    console.log('\n✅ Sample cohorts added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample cohorts:', error.message);
    process.exit(1);
  }
};

addSampleCohorts();
