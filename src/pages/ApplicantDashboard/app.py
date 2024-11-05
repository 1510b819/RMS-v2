import sys
import docx2txt
import nltk
import re
import os
import spacy
import json
from pdfminer.high_level import extract_text
from rapidfuzz import process, fuzz
from Skills_DB import SKILLS_DB
from Education_Pattern import EDUCATION_PATTERNS
from Courses import COURSES
import fitz  # PyMuPDF

# Pre-download only if necessary to avoid repetitive downloads
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

# Load the small version of spaCy model for performance reasons
nlp = spacy.load('en_core_web_sm', disable=['parser', 'tagger', 'lemmatizer'])

# Regex patterns
PHONE_REG = re.compile(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]')
EMAIL_REG = re.compile(r'[a-z0-9\.\-+_]+@[a-z0-9\.\-+_]+\.[a-z]+')

def extract_text_from_docx(docx_path):
    """Extract text from a DOCX file."""
    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"File '{docx_path}' not found")
    return docx2txt.process(docx_path).replace('\t', ' ')

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"File '{pdf_path}' not found")
    return extract_text(pdf_path)

def extract_names_with_pymupdf(pdf_path):
    """Extract names from a PDF file using PyMuPDF to account for formatting."""
    names = []
    doc = fitz.open(pdf_path)
    for page in doc:
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") == 0:  # Text block
                for line in block["lines"]:
                    line_text = ' '.join(span["text"].strip() for span in line["spans"])
                    if re.search(r'\w+,\s+\w+(?:\s+\w+)*', line_text):  # Matches "Last, First"
                        if any(span["size"] >= 25 for span in line["spans"]):
                            names.append(line_text.strip())
                    elif any(char.isalpha() for char in line_text):
                        if any(span["size"] >= 25 for span in line["spans"]):
                            names.append(line_text.strip())

    # Filter for unique names and prioritize uppercased ones
    names = list(set(names))
    upper_names = [name for name in names if name.isupper() or name.istitle()]

    return upper_names if upper_names else names

def extract_names(txt, file_path):
    """
    Extract names from text using NER from spaCy. Uses PyMuPDF for PDF files.
    """
    if file_path.endswith('.pdf'):
        names = extract_names_with_pymupdf(file_path)
    else:
        names = []

    # If names list is empty, use extract_text as fallback
    if not names:
        full_text = extract_text_from_pdf(file_path) if file_path.endswith('.pdf') else extract_text_from_docx(file_path)
        names = [ent.text.strip() for ent in nlp(full_text).ents if ent.label_ == 'PERSON' and any(char.isalpha() for char in ent.text)]

    # Clean names to remove unwanted characters and additional text
    cleaned_names = []
    for name in names:
        # Remove unwanted characters like line breaks
        clean_name = re.sub(r'\s+', ' ', name)  # Replace multiple whitespace with a single space
        clean_name = clean_name.strip()  # Remove leading/trailing whitespace

        # Remove trailing single letters or specific unwanted patterns only
        if clean_name.endswith('V'):
            clean_name = clean_name[:-1].strip()  # Remove trailing 'V' specifically
        
        cleaned_names.append(clean_name)  # Append cleaned name

    return cleaned_names[:1]  # Return the first found name, or empty if none

def extract_education(input_text):
    """Extract education-related keywords from input text."""
    education = {match for pattern in EDUCATION_PATTERNS for match in re.findall(pattern, input_text, re.IGNORECASE)}
    if education:
        longest_education = max(education, key=len)
        return longest_education, education  # Return longest match first

    exact_matches = [edu for edu in education if edu.lower() in (course.lower() for course in COURSES)]
    if exact_matches:
        return exact_matches[0], education  # Return the first exact match

    education_list = list(education)
    closest_course, score = process.extractOne(education_list[0], COURSES, scorer=fuzz.partial_ratio) if education_list else (None, 0)
    
    return closest_course, education

def extract_phone_number(resume_text):
    """Extract the first valid phone number from resume text."""
    phone = re.findall(PHONE_REG, resume_text)
    return phone[0] if phone and len(phone[0]) < 16 else None

def extract_emails(resume_text):
    """Extract all valid email addresses from resume text."""
    return re.findall(EMAIL_REG, resume_text)

def extract_skills(input_text):
    """Extract skills from the input text using a defined skills database."""
    stop_words = set(nltk.corpus.stopwords.words('english'))
    word_tokens = [w for w in nltk.tokenize.word_tokenize(input_text) if w.isalpha() and w.lower() not in stop_words]
    bigrams_trigrams = [' '.join(gram) for gram in nltk.everygrams(word_tokens, 2, 3)]
    skills_lower = {skill.lower() for skill in SKILLS_DB}

    found_skills = {token.lower() for token in word_tokens if token.lower() in skills_lower}
    found_skills.update(ngram.lower() for ngram in bigrams_trigrams if ngram.lower() in skills_lower)

    for skill in skills_lower:
        for token in word_tokens:
            if token.lower() != skill and token.lower().startswith(skill):
                found_skills.add(skill)
                break

        if all(word.lower() in word_tokens for word in skill.split()):
            found_skills.add(skill)

    for token in word_tokens:
        if token.lower() not in found_skills:
            closest_match = process.extractOne(token.lower(), skills_lower, scorer=fuzz.ratio, score_cutoff=85)
            if closest_match:
                found_skills.add(closest_match[0].lower())

    found_skills = {skill for skill in found_skills if skill in skills_lower}
    
    return found_skills

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Error: Please provide the file path of the PDF or DOCX file.")
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        text = extract_text_from_docx(file_path) if file_path.endswith('.docx') else extract_text_from_pdf(file_path)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)

    if text:
        names = extract_names(text, file_path)
        degree, education_keywords = extract_education(text)
        skills = extract_skills(text)
        phone_number = extract_phone_number(text)
        emails = extract_emails(text)

        output_data = {
            "names": names,
            "industry": {
                "Degree": degree,
                "Keywords": list(education_keywords)
            },
            "skills": list(skills),
            "phone": phone_number,
            "emails": emails
        }

        print(json.dumps(output_data, indent=4))
