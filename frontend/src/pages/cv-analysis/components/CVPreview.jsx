import { useState } from 'react';

export default function CVPreview({ sections }) {
  const [expandedSection, setExpandedSection] = useState(null);

  if (!sections || Object.keys(sections).length === 0) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSkills = (skills) => {
    if (!skills) return null;
    return (
      <div className="space-y-2">
        {skills.technical?.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Technical</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {skills.technical.map((skill, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        {skills.tools?.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Tools</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {skills.tools.map((tool, i) => (
                <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
        {skills.soft?.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Soft Skills</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {skills.soft.map((skill, i) => (
                <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExperience = (experience) => {
    if (!experience || experience.length === 0) return <p className="text-gray-500 text-sm">No experience found</p>;
    return (
      <div className="space-y-3">
        {experience.map((exp, i) => (
          <div key={i} className="border-l-2 border-blue-200 pl-3">
            <p className="font-medium text-gray-900 text-sm">{exp.title}</p>
            <p className="text-gray-600 text-xs">{exp.company}</p>
            <p className="text-gray-400 text-xs">{exp.duration}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderEducation = (education) => {
    if (!education || education.length === 0) return <p className="text-gray-500 text-sm">No education found</p>;
    return (
      <div className="space-y-3">
        {education.map((edu, i) => (
          <div key={i} className="border-l-2 border-green-200 pl-3">
            <p className="font-medium text-gray-900 text-sm">{edu.degree}</p>
            <p className="text-gray-600 text-xs">{edu.institution}</p>
            <p className="text-gray-400 text-xs">{edu.duration}</p>
          </div>
        ))}
      </div>
    );
  };

  const sectionConfig = [
    { key: 'skills', title: 'Skills', icon: 'ri-tools-line', render: renderSkills },
    { key: 'experience', title: 'Experience', icon: 'ri-briefcase-line', render: renderExperience },
    { key: 'education', title: 'Education', icon: 'ri-graduation-cap-line', render: renderEducation },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="ri-file-list-3-line mr-2 text-blue-600"></i>
        CV Summary
      </h3>

      {/* Personal Info */}
      {sections.personal_info && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900">{sections.personal_info.name || 'Name not detected'}</p>
          {sections.personal_info.email && (
            <p className="text-sm text-gray-600">{sections.personal_info.email}</p>
          )}
          {sections.personal_info.location && (
            <p className="text-sm text-gray-500">{sections.personal_info.location}</p>
          )}
        </div>
      )}

      {/* Expandable Sections */}
      <div className="space-y-2">
        {sectionConfig.map(({ key, title, icon, render }) => (
          <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center">
                <i className={`${icon} mr-2 text-gray-600`}></i>
                <span className="font-medium text-gray-700">{title}</span>
              </div>
              <i className={`ri-arrow-${expandedSection === key ? 'up' : 'down'}-s-line text-gray-400`}></i>
            </button>
            {expandedSection === key && (
              <div className="p-3 border-t border-gray-200">
                {render(sections[key])}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
