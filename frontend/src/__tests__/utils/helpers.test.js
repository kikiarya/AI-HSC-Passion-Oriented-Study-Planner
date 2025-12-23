import { describe, it, expect } from 'vitest';

describe('Frontend Helper Functions', () => {
  describe('Color Utilities', () => {
    it('should determine grade color', () => {
      const getGradeColor = (percentage) => {
        if (percentage >= 90) return 'green';
        if (percentage >= 80) return 'blue';
        if (percentage >= 70) return 'yellow';
        if (percentage >= 60) return 'orange';
        return 'red';
      };
      
      expect(getGradeColor(95)).toBe('green');
      expect(getGradeColor(85)).toBe('blue');
      expect(getGradeColor(75)).toBe('yellow');
      expect(getGradeColor(65)).toBe('orange');
      expect(getGradeColor(55)).toBe('red');
    });

    it('should generate random color', () => {
      const getRandomColor = () => {
        const colors = ['#FF5733', '#33FF57', '#3357FF'];
        return colors[Math.floor(Math.random() * colors.length)];
      };
      
      const color = getRandomColor();
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('Status Utilities', () => {
    it('should determine assignment status', () => {
      const getStatus = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        return due < now ? 'overdue' : 'pending';
      };
      
      expect(getStatus('2024-01-01')).toBe('overdue');
      expect(getStatus('2026-12-31')).toBe('pending');
    });

    it('should format status badge', () => {
      const getStatusBadge = (status) => {
        const badges = {
          'submitted': '✅ Submitted',
          'pending': '⏳ Pending',
          'graded': '📝 Graded'
        };
        return badges[status] || '❓ Unknown';
      };
      
      expect(getStatusBadge('submitted')).toBe('✅ Submitted');
      expect(getStatusBadge('pending')).toBe('⏳ Pending');
      expect(getStatusBadge('graded')).toBe('📝 Graded');
    });
  });

  describe('Text Processing', () => {
    it('should create slug from text', () => {
      const createSlug = (text) => 
        text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      
      expect(createSlug('Hello World')).toBe('hello-world');
      expect(createSlug('Test Case 123')).toBe('test-case-123');
    });

    it('should count words', () => {
      const countWords = (text) => text.trim().split(/\s+/).length;
      
      expect(countWords('hello world')).toBe(2);
      expect(countWords('one two three four')).toBe(4);
    });

    it('should extract first name and last name', () => {
      const splitName = (fullName) => {
        const parts = fullName.trim().split(/\s+/);
        return {
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || ''
        };
      };
      
      expect(splitName('John Doe')).toEqual({ firstName: 'John', lastName: 'Doe' });
      expect(splitName('Alice Bob Smith')).toEqual({ firstName: 'Alice', lastName: 'Bob Smith' });
    });
  });

  describe('Sorting and Filtering', () => {
    it('should sort students by name', () => {
      const students = [
        { name: 'Charlie' },
        { name: 'Alice' },
        { name: 'Bob' }
      ];
      
      const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));
      expect(sorted[0].name).toBe('Alice');
      expect(sorted[2].name).toBe('Charlie');
    });

    it('should filter by search term', () => {
      const items = ['Apple', 'Banana', 'Cherry'];
      const searchTerm = 'an';
      
      const filtered = items.filter(item => 
        item.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered).toEqual(['Banana']);
    });

    it('should paginate array', () => {
      const paginate = (arr, page, perPage) => {
        const start = (page - 1) * perPage;
        return arr.slice(start, start + perPage);
      };
      
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(paginate(items, 1, 3)).toEqual([1, 2, 3]);
      expect(paginate(items, 2, 3)).toEqual([4, 5, 6]);
    });
  });
});

