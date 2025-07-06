import os
import pandas as pd
import pdfplumber
import re
from pathlib import Path
import logging
from typing import List, Dict, Tuple

# Configure logging for clear feedback
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class FixedRainfallParser:
    
    def __init__(self, debug: bool = False):
        self.debug = debug
        if debug:
            logging.getLogger().setLevel(logging.DEBUG)

        # Define correct region and district mappings
        self.region_mappings = {
            'KACHCHH': 'Kachchh',
            'NORTH GUJARAT': 'North Gujarat', 
            'EAST-CENTRAL GUJARAT': 'East Central Gujarat',
            'SAURASHTRA': 'Saurashtra',
            'SOUTH GUJARAT': 'South Gujarat'
        }
        
        # Comprehensive district mappings for all regions
        self.district_mappings = {
            # Kachchh region
            'Kachchh': ['Abdasa', 'Anjar', 'Bhachau', 'Bhuj', 'Gandhidham', 'Lakhpat', 
                       'Mandvi(Kachchh)', 'Mundra', 'Nakhatrana', 'Rapar'],
            
            # North Gujarat region  
            'Patan': ['Chanasma', 'Harij', 'Patan', 'Radhanpur', 'Sami', 'Santalpur', 
                     'Sarswati', 'Shankheshvar', 'Sidhpur'],
            'Banaskantha': ['Amirgadh', 'Bhabhar', 'Danta', 'Dantiwada', 'Deesa', 'Deodar',
                           'Dhanera', 'Kankrej', 'Lakhani', 'Palanpur', 'Suigam', 'Tharad', 
                           'Vadgam', 'Vav'],
            'Mahesana': ['Becharaji', 'Jotana', 'Kadi', 'Kheralu', 'Mahesana', 'Satlasana',
                        'Unjha', 'Vadnagar', 'Vijapur', 'Visnagar'],
            'Sabarkantha': ['Himatnagar', 'Idar', 'Khedbrahma', 'Poshina', 'Prantij', 
                           'Talod', 'Vadali', 'Vijaynagar'],
            'Aravalli': ['Bayad', 'Bhiloda', 'Dhansura', 'Malpur', 'Meghraj', 'Modasa'],
            
            # CRITICAL FIX: Gandhinagar district with its 4 talukas
            'Gandhinagar': ['Dehgam', 'Gandhinagar', 'Kalol(Gandhinagar)', 'Mansa'],
            
            # East Central Gujarat region
            'Ahmedabad': ['Ahmedabad City', 'Bavla', 'Daskroi', 'Dhandhuka', 'Dholera', 
                         'Dholka', 'Mandal', 'Sanand', 'Viramgam'],
            'Anand': ['Anand', 'Borsad', 'Khambhat', 'Petlad', 'Sojitra', 'Tarapur', 'Umreth'],
            'Kheda': ['Kapadvanj', 'Kathlal', 'Kheda', 'Matar', 'Mehmedabad', 'Nadiad', 'Thasra'],
            'Panchmahal': ['Ghoghamba', 'Godhra', 'Halol', 'Jambughoda', 'Kalol', 'Lunawada', 
                          'Morwa (Hadaf)', 'Santrampur', 'Shehera'],
            'Dahod': ['Dahod', 'Devgadbaria', 'Fatepura', 'Garbada', 'Jhalod', 'Limkheda', 
                     'Sanjeli', 'Singvad'],
            'Vadodara': ['Dabhoi', 'Karjan', 'Padra', 'Sankheda', 'Savli', 'Vadodara', 'Vaghodia'],
            'Chhota Udepur': ['Bodeli', 'Chhota Udepur', 'Jetpur Pavi', 'Kavant', 'Nasvadi', 'Sankheda'],
            'Mahisagar': ['Balasinor', 'Khanpur', 'Lunawada', 'Santrampur', 'Virpur'],
            
            # Saurashtra region
            'Rajkot': ['Dhoraji', 'Gondal', 'Jasdan', 'Jetpur', 'Kotda Sangani', 'Lodhika', 
                      'Morbi', 'Paddhari', 'Rajkot', 'Tankara', 'Wankaner'],
            'Jamnagar': ['Dhrol', 'Jamnagar', 'Jodiya', 'Kalavad', 'Khambhalia', 'Lalpur'],
            'Porbandar': ['Kutiyana', 'Porbandar', 'Ranavav'],
            'Junagadh': ['Bhesan', 'Junagadh', 'Junagadh City', 'Keshod', 'Maliya Hatina', 
                        'Manavadar', 'Mangrol(Junagadh)', 'Mendarda', 'Talala', 'Vanthali', 'Visavadar'],
            'Amreli': ['Amreli', 'Babra', 'Dhari', 'Jafrabad', 'Kunkavav Vadia', 'Lathi', 
                      'Lilia', 'Rajula', 'Savarkundla', 'Bagasara'],
            'Bhavnagar': ['Bhavnagar', 'Gariadhar', 'Ghogha', 'Mahuva (Bhavnagar)', 'Palitana', 
                         'Shihor', 'Talaja', 'Umrala', 'Vallabhipur'],
            'Botad': ['Barwala', 'Botad', 'Gadhada', 'Ranpur'],
            'Gir Somnath': ['Gir Gadhada', 'Kodinar', 'Patan-Veraval', 'Sutrapada', 'Una'],
            'Devbhumi Dwarka': ['Bhanvad', 'Dwarka', 'Jamjodhpur', 'Khambha'],
            'Morbi': ['Halvad', 'Maliya', 'Morbi', 'Thangadh', 'Wankaner'],
            'Surendranagar': ['Chuda', 'Chotila', 'Dasada', 'Dhrangadhra', 'Halvad', 'Lakhtar', 
                             'Limbdi', 'Muli', 'Sayla', 'Wadhwan'],
            
            # South Gujarat region
            'Surat': ['Bardoli', 'Chorasi', 'Kamrej', 'Mandvi', 'Olpad', 'Palsana', 'Surat City', 
                     'Umarpada', 'Vyara'],
            'Bharuch': ['Amod', 'Ankleshwar', 'Bharuch', 'Hansot', 'Jambusar', 'Jhagadia', 
                       'Netrang', 'Vagra', 'Valia'],
            'Narmada': ['Dediapada', 'Garudeshwar', 'Nandod', 'Sagbara', 'Tilakwada'],
            'Navsari': ['Chikhli', 'Gandevi', 'Jalalpore', 'Khergam', 'Navsari', 'Vansada'],
            'Valsad': ['Dharampur', 'Kaprada', 'Pardi', 'Umbergaon', 'Valsad', 'Vapi'],
            'Tapi': ['Cucarmunda', 'Dolvan', 'Nizar', 'Songadh', 'Subir', 'Uchchhal', 'Valod', 'Vyara'],
            'Dang': ['Dang-Ahwa', 'Vaghai']
        }

        # Enhanced regex patterns
        self.region_pattern = re.compile(
            r'^\s*(KACHCHH|NORTH GUJARAT|EAST-CENTRAL GUJARAT|SAURASHTRA|SOUTH GUJARAT)\s*$', 
            re.IGNORECASE
        )
        
        # Pattern for data lines with serial number
        self.data_pattern_with_srno = re.compile(
            r'^\s*(\d+)\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$'
        )
        
        # Pattern for data lines without serial number
        self.data_pattern_no_srno = re.compile(
            r'^\s*([A-Za-z\s\(\)-]+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$'
        )
        
        # Pattern for district averages
        self.dist_avg_pattern = re.compile(
            r'^\s*Dist\.\s*Avg\.\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$'
        )
        
        # Pattern for region summaries
        self.region_summary_pattern = re.compile(
            r'^\s*(KACHCHH REGION|N\.G\.REGION|Est-Cen\.G\.REGION|SAU\.REGION|S\.G\.REGION)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$'
        )

    def _normalize_name(self, name: str) -> str:
        """Cleans up and standardizes a name with special handling for Gandhinagar."""
        name = name.strip()
        
        # Handle specific known issues
        if name == 'Kalol(Gnr)':
            return 'Kalol(Gandhinagar)'
        if name == 'Detroj-Rampura':
            return 'Detroj Rampura'
        
        # Clean up spacing
        return re.sub(r'\s+', ' ', name).strip()

    def _is_header_or_useless(self, line: str) -> bool:
        """Identifies and skips header lines and useless rows."""
        line_upper = line.upper().strip()
        
        # Skip common headers
        header_keywords = [
            'SR.', 'DISTRICT', 'TALUKA', 'AVRG RAIN', 'RAIN TILL', 'TOTAL',
            'STATE EMERGENCY OPERATION', 'RAINFALL REPORT', 'PAGE',
            'GUJARAT STATE', 'RAIN DURING', '% AGAINST'
        ]
        
        if any(keyword in line_upper for keyword in header_keywords):
            return True
            
        # Skip the useless numeric row (1 2 3 4 5 6 7)
        if re.match(r'^\s*1\s+2\s+3\s+4\s+5\s+6\s+7\s*$', line):
            return True
            
        # Skip lines that are mostly numbers in sequence
        if re.match(r'^\s*\d\s+\d\s+\d\s+\d\s+\d\s+\d\s*$', line):
            return True
            
        return False

    def _get_district_for_taluka(self, taluka_name: str, current_region: str) -> str:
        """
        Determines the correct district for a given taluka.
        CRITICAL: Special handling for Gandhinagar taluka vs district confusion.
        """
        # CRITICAL FIX: Handle Gandhinagar specifically
        if taluka_name.lower() == 'gandhinagar':
            return 'Gandhinagar'  # Gandhinagar taluka belongs to Gandhinagar district
        
        # Handle other special cases
        if taluka_name == 'Kalol(Gandhinagar)' or taluka_name == 'Kalol(Gnr)':
            return 'Gandhinagar'
        
        # Search through all district mappings
        for district, talukas in self.district_mappings.items():
            if taluka_name in talukas:
                return district
        
        # Special handling for some talukas that might have variations
        taluka_variations = {
            # 'Anklav': 'Ankleshwar',
        }
        
        if taluka_name in taluka_variations:
            normalized_name = taluka_variations[taluka_name]
            for district, talukas in self.district_mappings.items():
                if normalized_name in talukas:
                    return district
        
        # If still not found, return Unknown
        return "Unknown"

    def _is_district_name(self, name: str) -> bool:
        """Check if a name is a known district name."""
        normalized_name = self._normalize_name(name)
        return normalized_name in self.district_mappings

    def _extract_columns_from_pdf(self, pdf_path: str) -> List[str]:
        """Extracts text from PDF with better column separation."""
        logging.info("Extracting text and separating columns...")
        all_columns_text = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                # More precise column separation
                page_width = page.width
                middle_point = page_width / 2
                
                # Define bounding boxes with better margins
                left_bbox = (0, 0, middle_point - 10, page.height)
                right_bbox = (middle_point + 10, 0, page_width, page.height)
                
                left_text = page.within_bbox(left_bbox).extract_text()
                right_text = page.within_bbox(right_bbox).extract_text()

                if left_text and left_text.strip():
                    all_columns_text.append(left_text)
                if right_text and right_text.strip():
                    all_columns_text.append(right_text)
        
        logging.info(f"Extracted {len(all_columns_text)} text blocks from PDF.")
        return all_columns_text

    def _parse_text_block(self, text_block: str, context: Dict) -> Tuple[List[Dict], Dict]:
        """Parses a single text block with improved logic and Gandhinagar fix."""
        lines = text_block.split('\n')
        parsed_data = []
        
        current_region = context.get("current_region", "Unknown")
        current_district = context.get("current_district", "Unknown")

        for line in lines:
            line = line.strip()

            if not line or self._is_header_or_useless(line):
                continue
            
            # Check for region headers first
            region_match = self.region_pattern.match(line)
            if region_match:
                region_name = region_match.group(1)
                current_region = self.region_mappings.get(region_name, region_name)
                current_district = "Unknown"
                continue
                
            # Check for region summary lines
            region_summary_match = self.region_summary_pattern.match(line)
            if region_summary_match:
                groups = region_summary_match.groups()
                region_abbr = groups[0]
                
                # Map region abbreviations to full names
                region_mapping = {
                    'KACHCHH REGION': 'Kachchh',
                    'N.G.REGION': 'North Gujarat', 
                    'Est-Cen.G.REGION': 'East Central Gujarat',
                    'SAU.REGION': 'Saurashtra',
                    'S.G.REGION': 'South Gujarat'
                }
                
                region_name = region_mapping.get(region_abbr, region_abbr)
                
                parsed_data.append({
                    "region": region_name,
                    "district": f"{region_name} Region",
                    "sr_no": None,
                    "taluka": f"{region_name} Region Avg",
                    "avg_rain_1995_2024": float(groups[1]),
                    "rain_till_yesterday": float(groups[2]),
                    "rain_last_24hrs": float(groups[3]),
                    "total_rainfall": float(groups[4]),
                    "percent_against_avg": float(groups[5]),
                })
                continue
                
            # Check for district averages
            dist_avg_match = self.dist_avg_pattern.match(line)
            if dist_avg_match:
                groups = dist_avg_match.groups()
                parsed_data.append({
                    "region": current_region,
                    "district": current_district,
                    "sr_no": None,
                    "taluka": f"{current_district} District Avg",
                    "avg_rain_1995_2024": float(groups[0]),
                    "rain_till_yesterday": float(groups[1]),
                    "rain_last_24hrs": float(groups[2]),
                    "total_rainfall": float(groups[3]),
                    "percent_against_avg": float(groups[4]),
                })
                continue
                
            # Check for data with serial number
            data_with_srno_match = self.data_pattern_with_srno.match(line)
            if data_with_srno_match:
                groups = data_with_srno_match.groups()
                taluka_name = self._normalize_name(groups[1])
                
                # CRITICAL: Determine correct district for this taluka
                correct_district = self._get_district_for_taluka(taluka_name, current_region)
                if correct_district != "Unknown":
                    current_district = correct_district
                
                parsed_data.append({
                    "region": current_region,
                    "district": current_district,
                    "sr_no": float(groups[0]),
                    "taluka": taluka_name,
                    "avg_rain_1995_2024": float(groups[2]),
                    "rain_till_yesterday": float(groups[3]),
                    "rain_last_24hrs": float(groups[4]),
                    "total_rainfall": float(groups[5]),
                    "percent_against_avg": float(groups[6]),
                })
                continue
                
            # Check for data without serial number
            data_no_srno_match = self.data_pattern_no_srno.match(line)
            if data_no_srno_match:
                groups = data_no_srno_match.groups()
                taluka_name = self._normalize_name(groups[0])
                
                # CRITICAL: Determine correct district for this taluka
                correct_district = self._get_district_for_taluka(taluka_name, current_region)
                if correct_district != "Unknown":
                    current_district = correct_district
                
                parsed_data.append({
                    "region": current_region,
                    "district": current_district,
                    "sr_no": None,
                    "taluka": taluka_name,
                    "avg_rain_1995_2024": float(groups[1]),
                    "rain_till_yesterday": float(groups[2]),
                    "rain_last_24hrs": float(groups[3]),
                    "total_rainfall": float(groups[4]),
                    "percent_against_avg": float(groups[5]),
                })
                continue
                
            # Check if line might be a district name (but not "Gandhinagar" ambiguity)
            if (not any(char.isdigit() for char in line) and 
                len(line.split()) <= 3 and 
                len(line) > 2):
                
                potential_district = self._normalize_name(line)
                if self._is_district_name(potential_district):
                    current_district = potential_district
                    if self.debug:
                        logging.debug(f"Setting current district to: {current_district}")

        # Return parsed data and updated context
        new_context = {
            "current_region": current_region, 
            "current_district": current_district
        }
        return parsed_data, new_context

    def process_pdf_to_dataframe(self, pdf_path: str) -> pd.DataFrame:
        """Main processing function with enhanced Gandhinagar handling."""
        if not Path(pdf_path).exists():
            raise FileNotFoundError(f"PDF file not found at '{pdf_path}'")

        column_texts = self._extract_columns_from_pdf(pdf_path)
        
        all_data = []
        context = {"current_region": "Unknown", "current_district": "Unknown"}

        for i, text_block in enumerate(column_texts):
            logging.info(f"--- Parsing Column Block {i+1}/{len(column_texts)} ---")
            block_data, context = self._parse_text_block(text_block, context)
            all_data.extend(block_data)
            logging.info(f"Found {len(block_data)} records in this block.")

        if not all_data:
            logging.warning("No data could be parsed from the PDF.")
            return pd.DataFrame()

        df = pd.DataFrame(all_data)
        
        # Clean up the DataFrame
        df['region'] = df['region'].replace('Unknown', pd.NA).ffill()
        
        # CRITICAL: Fix district mapping using the comprehensive district mappings
        for idx, row in df.iterrows():
            if row['taluka'] and not row['taluka'].endswith(' Avg'):
                correct_district = self._get_district_for_taluka(row['taluka'], row['region'])
                if correct_district != "Unknown":
                    df.at[idx, 'district'] = correct_district
        
        # Remove rows where essential data is missing
        df = df.dropna(subset=['taluka', 'total_rainfall'])
        
        # Remove duplicates, keeping first occurrence
        df = df.drop_duplicates(subset=['region', 'district', 'taluka'], keep='first')
        
        # Fix specific issues
        df.loc[df['taluka'] == 'Kalol(Gnr)', 'taluka'] = 'Kalol(Gandhinagar)'
        
        logging.info(f"Successfully processed PDF. Total records: {len(df)}")
        
        # DEBUGGING: Check if Gandhinagar taluka is present
        gandhinagar_talukas = df[df['district'] == 'Gandhinagar']['taluka'].unique()
        logging.info(f"Found Gandhinagar district talukas: {list(gandhinagar_talukas)}")
        
        return df

    def save_to_csv(self, df: pd.DataFrame, output_path: str):
        """Saves the DataFrame to CSV with proper formatting."""
        if df.empty:
            logging.warning("DataFrame is empty. Nothing to save.")
            return

        # Ensure proper column order
        columns = [
            "region", "district", "sr_no", "taluka", 
            "avg_rain_1995_2024", "rain_till_yesterday", "rain_last_24hrs", 
            "total_rainfall", "percent_against_avg"
        ]
        df = df.reindex(columns=columns)
        
        # Sort for clean output
        df = df.sort_values(by=['region', 'district', 'sr_no', 'taluka']).reset_index(drop=True)
        
        df.to_csv(output_path, index=False, encoding='utf-8')
        logging.info(f"Data successfully saved to '{output_path}'")


if __name__ == '__main__':
    dir=r'D:\Projects\Table Extractor'
    # for i in os.listdir(dir):
        # if os.path.isfile(i) and i.lower().endswith('18th June.pdf'):
    PDF_FILE_PATH = r"D:\Projects\Table Extractor\18th June.pdf"
    OUTPUT_CSV_PATH = f'{PDF_FILE_PATH[:-4]}.csv'
    parser = FixedRainfallParser(debug=False)  # Enable debug for Gandhinagar tracking
    try:
            rainfall_df = parser.process_pdf_to_dataframe(PDF_FILE_PATH)

            if not rainfall_df.empty:
                parser.save_to_csv(rainfall_df, OUTPUT_CSV_PATH)
                    
                print("\n" + "="*80)
                print("    GANDHINAGAR TALUKA ISSUE FIXED - Rainfall Data Extraction Complete")
                print("="*80)
                print(f"Data saved to: {OUTPUT_CSV_PATH}\n")
                    
                print("--- Data Summary ---")
                print(f"Total Records: {len(rainfall_df)}")
                print(f"Regions: {rainfall_df['region'].nunique()} -> {rainfall_df['region'].unique().tolist()}")
                print(f"Districts: {rainfall_df['district'].nunique()}")
                    
                    # CRITICAL: Check specifically for Gandhinagar
                print("\n--- GANDHINAGAR DISTRICT CHECK ---")
                gandhinagar_data = rainfall_df[rainfall_df['district'] == 'Gandhinagar']
                if not gandhinagar_data.empty:
                    print(f"✅ SUCCESS: Found {len(gandhinagar_data)} records in Gandhinagar district")
                    print("Gandhinagar district talukas found:")
                    for taluka in gandhinagar_data['taluka'].unique():
                        print(f"  - {taluka}")
                    else:
                        print("❌ ERROR: No Gandhinagar district records found!")
                    
                    print("\n--- Sample from Each Region ---")
                    for region in rainfall_df['region'].unique():
                        if region and not region.endswith(' Region'):                            region_data = rainfall_df[rainfall_df['region'] == region].head(5)
                        print(f"\n{region} Region:")
                        print(region_data[['region', 'district', 'taluka', 'total_rainfall']].to_string(index=False))
                    
                print("\n--- District Distribution ---")
                district_counts = rainfall_df['district'].value_counts()
                print(district_counts.head(15))

    except FileNotFoundError:
            print(f"\nERROR: The file '{PDF_FILE_PATH}' was not found.")
    except Exception as e:
            logging.error(f"An unexpected error occurred: {e}", exc_info=True)