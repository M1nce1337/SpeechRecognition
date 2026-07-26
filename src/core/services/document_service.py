from fastapi.responses import StreamingResponse
from docxtpl import DocxTemplate
from dto.answer_dto import AnswerDTO
from io import BytesIO

class DocumentService:
    def create_document(self, context: AnswerDTO) -> StreamingResponse:
        """
        Создание DOCX документа на основе ответа от LLM
        """
        self._doc_template = DocxTemplate("core/documents/medcard_template.docx")
        self._doc_template.render(context)

        result = BytesIO()
        self._doc_template.save(result)

        result.seek(0)

        return StreamingResponse(
            result,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=medcard.docx"}
        )      
    
document_service = DocumentService()      