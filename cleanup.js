const fs = require('fs');
let code = fs.readFileSync('src/components/InfrastructureModule.tsx', 'utf8');

code = code.replace(/const SEED_DATA_RAW = `[\s\S]*?`;\n\n/, '');
code = code.replace(/  const seedProvidedData = \(\) => \{[\s\S]*?\};\n\n/, '');
code = code.replace(/  const migrateDatabaseTo2025 = async \(\) => \{[\s\S]*?\};\n\n/, '');
code = code.replace(/                  <div className="md:col-span-2 bg-slate-50 p-8 rounded-\[2rem\] space-y-4 flex flex-col md:flex-row items-center text-center md:text-left justify-between border border-slate-100">[\s\S]*?<\/div>\n\n/, '');
code = code.replace(/                  <div className="md:col-span-2 bg-orange-50 p-8 rounded-\[2rem\] space-y-4 flex flex-col md:flex-row items-center text-center md:text-left justify-between border border-orange-100">[\s\S]*?<\/div>\n/, '');

fs.writeFileSync('src/components/InfrastructureModule.tsx', code);
console.log('Cleanup complete');
